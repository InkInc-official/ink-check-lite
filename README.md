# 🖤 Ink Check Lite

**IRIAMライバー向け セルフストレスチェックツール**

> Made by [Ink Inc.](https://inkinc-hp.vercel.app/) | AI Creation, Human Care. The Future Drawn Together.

---

## 概要

個人IRIAMライバーが自分のメンタル状態を記録・把握するためのセルフストレスチェックツールです。

- 好きなタイミングで回答できる
- スコアの推移をグラフで確認できる
- データはローカルに保存（外部送信なし）
- 完全無料・OSS

> 所属事務所による管理・AI所見・Discord通知が必要な方は [Ink Inc.](https://inkinc-hp.vercel.app/) をご覧ください。

---

## セットアップ

### 必要なもの

- Python 3.10以上

### 手順

```bash
# 1. リポジトリをクローン
git clone https://github.com/InkInc-official/ink-check-lite.git
cd ink-check-lite

# 2. 依存インストール
pip install -r requirements.txt

# 3. 起動
python main.py
```

ブラウザで `http://localhost:8080` を開いてください。

---

## 使い方

### アンケートタブ
- 名前を入力してスコアを回答
- 送信後にアラートレベルが表示される

### 集計タブ
- 名前を入力して過去のスコア推移グラフを確認

---

## アラートレベル

| レベル | 条件 |
|---|---|
| 🟢 GREEN | 問題なし |
| 🟡 YELLOW | 高スコアあり・テキスト記入あり |
| 🔴 RED | 面接希望あり |

---

## スコアの定義

| 値 | 意味 |
|---|---|
| 1 | 良好・問題なし |
| 2 | やや気になる |
| 3 | 注意が必要 |
| 4 | かなりつらい |
| 5 | 非常につらい |

---

## Ink Inc. について

このツールはIRIAMライバー事務所「Ink Inc.」が制作しました。

Ink Inc.に所属すると以下の機能が利用できます：

- 所長（精神保健福祉士）によるメンタルサポート
- AIによる自動所見生成（ローカルLLM）
- 所長へのDiscord自動通知
- 時系列・継続アラート分析
- 月次ストレスチェック管理

**所属ライバー募集中** → [公式サイト](https://inkinc-hp.vercel.app/)

---

## ライセンス

CC BY-NC 4.0

- ✅ 個人・非商用目的での使用・改変・再配布
- ❌ 商用利用禁止
- ❌ Ink Inc.クレジットの削除禁止

---

*© 2026 黒井葉跡 / Ink Inc.*
