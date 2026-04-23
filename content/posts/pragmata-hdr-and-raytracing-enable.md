---
date: '2026-04-23T14:33:40+08:00'
draft: false
title: 'PRAGMATA(识质存在) 在Linux环境下无法开启hdr和光线追踪'
categories: ["游戏"]
tags:
  - Linux
  - 游戏
  - Steam
  - Proton
---
跳票多次的举牌小萝莉终于发售了，首发购入准备养赛博女儿，结果一进游戏居然开不了hdr和光线追踪，想了想生化危机9开启光线追踪和不开的差别，还是先解决问题在进游戏吧。

**背景环境**

- **操作系统：** CachyOS (KDE Plasma Wayland)
- **硬件平台：** NVIDIA RTX 5070 Ti
- **兼容层：** CachyOS-Proton
- **核心问题：** 游戏可正常调用 DLSS 及帧生成，但光线追踪与路径追踪选项置灰；HDR 无法开启。
本文记录了针对上述问题的完整底层排查流程与解决方案。

---

### 一、 使用Gamescope开启hdr
一开始尝试通过设置启动项 `ENABLE_HDR_WSI=1 VKD3D_CONFIG=dxr,dxr11 VKD3D_FEATURE_LEVEL=12_2 PROTON_ENABLE_NVAPI=1 %command%` 开启hdr和光追，结果没有任何作用，于是尝试通过Gamescope 的 `--hdr-enabled` 参数开启hdr: 
`gamescope -W 3840 -H 2160 -r 120 --hdr-enabled -- env ENABLE_HDR_WSI=1 VKD3D_CONFIG=dxr,dxr11 VKD3D_FEATURE_LEVEL=12_2 PROTON_ENABLE_NVAPI=1 %command%`
结果hdr开启了，光追没有，而且游戏窗口无法全屏，上面有窗口边框，下面有任务栏。
通过 Gamescope 强制全屏（`-f`）运行游戏，出现只有音频无画面（幽灵窗口）的现象，Gemini说是 CachyOS 预置的底层优化导致 Gamescope 与 KWin (Wayland) 在窗口焦点及 Surface 申请上发生冲突。同时，未显式声明 Gamescope 的 WSI（窗口系统集成），导致 Vulkan 无法正确识别色彩空间转换层。

**解决方案：**
放弃强制全屏，改用无边框窗口模式。
`gamescope -W 3840 -H 2160 -r 120 --hdr-enabled --borderless -- env ENABLE_GAMESCOPE_WSI=1 DXVK_HDR=1 PROTON_ENABLE_NVAPI=1 VKD3D_CONFIG=dxr,dxr11 VKD3D_FEATURE_LEVEL=12_2 %command%` 
最终成功开启hdr，且没有窗口边框了，不过进游戏会发现底部任务栏还在，按 `win + F` 快捷键可以直接全屏。

---

### 二、 光线追踪选项置灰：绕过 RE 引擎硬编码限制
**故障现象：**
即使向 `vkd3d` 传入了 `dxr,dxr11` 及 `VKD3D_FEATURE_LEVEL=12_2`，向引擎证明了硬件具备 DX12 Ultimate 能力，游戏内的光追选项依然处于不可选的灰色状态。

**排查分析：**
一般来说游戏应该已经获取到显卡支持光追的信息了，连dlss和四倍帧生成都支持，不应该开不了光追，在网上搜索了一下发现问题在于卡普空 RE 引擎的首发防崩溃机制：**引擎内置了 WINE/Proton 嗅探器，一旦检测到非原生 Windows 环境，即从代码层强制阻断光线追踪的初始化**。

**解决方案：**
向游戏可执行文件传递隐藏启动参数，致盲其 WINE 探测机制。
`env VKD3D_CONFIG=dxr,dxr11 %command% /WineDetectionEnabled:False`
参数核心解析：
/WineDetectionEnabled:False：注意，这个参数必须放在 %command% 的后面。这是 RE 引擎内部的隐藏命令行 flag，它的作用是直接弄瞎游戏的“WINE 嗅探器”。游戏一旦不知道自己运行在 Linux 上，再配合前面传递的 dxr 环境变量，光追选项就会全部解锁。

**风险警告：** 网上搜索信息发现该游戏搭载 Denuvo 加密，排查期间如果频繁切换 Proton 容器版本或重置 WINE Prefix，可能触发 D加密“24小时内最多激活5台设备”的红线，导致账号 24 小时锁定。

---

### 三、 最终解决方案
设置steam的启动参数：
```bash
gamescope -W 3840 -H 2160 -r 120 --hdr-enabled --borderless -- env VKD3D_CONFIG=dxr,dxr11 %command% /WineDetectionEnabled:False
```
分辨率和fps可以根据实际情况设置。