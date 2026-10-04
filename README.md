# 会说话的奶龙 - Talking Nailong 3D

单文件 3D 虚拟宠物互动游戏。Three.js（r147 UMD）、GLTFLoader、奶蛙 GLB 美术模型与笑声片段全部内联进一个 HTML，**双击即可运行，无需服务器、无需联网**。

## 在线试玩

- 游戏：https://talking-milk-dragon.app.workbuddy.host/
- 皮肤图鉴：https://talking-milk-dragon.app.workbuddy.host/skins.html

## 仓库内容（源码）

| 文件 | 说明 |
|---|---|
| `naitalking.tpl.html` | 游戏模板：HTML + CSS + 全部游戏逻辑（含任务/金币/商店/设置/新手引导） |
| `_build_glb.js` | 构建脚本：把模板 + Three.js + GLTFLoader + GLB 模型 + 笑声打包成单文件 `naitalking.html` |
| `skins.html` | 皮肤图鉴页（SVG 画出 6 款皮肤配色与配饰，读取存档显示拥有状态） |
| `_three_r147.js` | 内联依赖：Three.js r147 UMD 全局构建 |
| `_gltfloader.js` | 内联依赖：GLTFLoader（r147 全局） |
| `_laugh_clip.txt` | 奶龙笑声片段（data URI） |

## 重新构建

```bash
GLB='C:/Users/赖文钊/Downloads/81bdffae172ff9245ff73e6d5a99ec21.glb' node _build_glb.js
```

⚠️ 构建脚本默认 GLB 是 `7b3ef54e...glb`（红橙色，不是本项目的奶蛙）。
本项目的奶蛙是 **`81bdffae172ff9245ff73e6d5a99ec21.glb`**（黄色、白肚皮、绿眼睛），
重建时**必须**用 `GLB=` 环境变量显式指定，否则会回退到错的红橙模型。

模型朝向：该 GLB 身高轴沿 X（横躺、头朝左），构建时已用 `root.rotation.z = -Math.PI / 2` 立正，
并用 billboard + 略左转解决薄板立牌侧面漏黑边。

## 大文件在 Release 附件

87MB 的成品 `naitalking.html` 与 65MB 的奶蛙 GLB **超过 GitHub 单文件提交上限**
（REST `git/blobs` 请求体约 100MB，base64 后 87MB 会 422），
因此不进 git 树，改为 Release `v1` 附件发布（raw binary，单文件上限 2GB）：

- `naitalking.html` —— 可直接双击游玩的成品
- `81bdffae172ff9245ff73e6d5a99ec21.glb` —— 奶蛙美术模型（重建游戏所需）

见仓库右侧 **Releases / v1**。

## 玩法

点角色的头 / 肚子 / 小手 / 小脚有不同反应；底部按钮可说话（麦克风复读，1.5 倍变声）、打招呼、大笑、戳一戳、喂食。
互动每次给金币，完成「挑战任务」奖励更多，可在 👕 衣橱解锁 6 款皮肤。右上角可切换 5 个场景、⚙ 打开设置（音效 / 低性能模式 / 全屏）。
