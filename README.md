# FlipPlayer.js
[動作サンプル](https://yosgspec.web.fc2.com/FlipPlayer/)

## 概要
画像をパラパラ漫画やスライドのように表示できるJavaScript用ライブラリです。  
元々はParaFlaで作成したごくごく簡単なswfファイルを置き換えるために設計されました。

## 特徴
* クリックやキーボード入力などによる自由な画像切替
* 時間指定による自動での画像切替
* 画像終了時にリプレイorリンク移動
* ES5準拠(クロスブラウザ対応、IEは9以降)
* jQuery未使用(余計な外部ライブラリは不要)
* 背景画像の設定
* コールバック関数を用いた細かい挙動変更

## 使用例
```html
<div id="flip" onclick="flip.next()" style="width:512;height:320;"></div>
<button onclick="flip.prev().stop()">Prev</button>
<button onclick="flip.stop()">Stop</button>
<button onclick="flip.reset()">Reset</button>
<script src="FlipPlayer.js"></script>
<script>
var flip = new FlipPlayer(
	"flip",            //対象となるdiv要素のid名
	//以下再生される画像の配列
	//1画像の情報は [画像パス, 画像あたりの表示フレーム数]
	//または"for"～"next"によるループ構文を使用可能
	//多重ループには対応しない
	//ループ開始: ["for", ループ回数]
	//ループ終了: ["next"]
	[
		["flipStart.png", 0],
		["000.png", 10],
		["for", 5],    // ループ開始
		["001.png", 30],
		["002.png", 30],
		["next"],      // ループ終了
		["003.png", 40],
		["004.png", 25],
		["flipEnd.png", 0]
	],
	{
		//カレントディレクトリを指定する(適用時ファイル名相対パス不可)。
		cd: "./",
		//1フレーム毎の表示時間[ms]。デフォルトは83.333...ms(12fps)。
		frameTime: 50,
		//終了時にジャンプする場合URL。nullの時リプレイする。
		jumpURL: "http://yosgspec.web.fc2.com/",
		//背景画像を指定する。
		background: "bg.png",
		//サイズ拡大時のアンチエイリアスを無効にする。
		isPixelated: true,
		//キーイベントを設定。
		//オブジェクトを与えると有効になる。
		//あらかじめ、対象となるキー(○○Keys)とアクション(on○○Keys)が
		//デフォルトで与えられている。
		//これは上書きして変更できる。
		//キーかアクションのどちらかにnullを与えると該当するキーイベントは無効化される。
		//onNextKeys,onPrevKeys,onStopKeys,onResetKeysは"keyup"であるが、
		//onSkipKeysのみ"keydown"となっている。
		keyEvents: {
			nextKeys: ["z","Z"," ","Spacebar","Enter","ArrowRight","Right"],
			onNextKeys: flip.next,
			onPrevKeys: null
		},
		//画像切替時に任意の操作を行う関数を与える。
		callback: function(flip, index, frames){
			console.log(index + frames[index][0]);
		}
	}
);
</script>
```

## API
```js
var flip = new FlipPlayer(
	id :string,
	frames :[frame :string, times :number][],
	{
		cd :string,
		frameTime :number,
		jumpURL :string,
		background :string,
		isPixelated :boolean = true,
		keyEvents: {
			nextKeys :string[] = ["z","Z"," ","Spacebar","ArrowRight","Right"],
			onNextKeys :Function() = flip.next,
			skipKeys :string[] = ["x","X"],
			onSkipKeys :Function() = flip.next,
			prevKeys :string[] = ["Backspace","ArrowLeft","Left"],
			onPrevKeys :Function() = ()=>flip.prev().stop(),
			stopKeys: string[] = ["p","P","ArrowDown","Down"],
			onStopKeys :Function() = flip.stop,
			resetKeys :string[] = ["t","T","Escape","Esc","ArrowUp","Up"],
			onResetKeys :Function() = flip.reset
		},
		callback :Function(
			flip :FlipPlayer,
			index :number,
			flames :[frame :string, times :number][]
		)
	}
)
```	
FlipPlayerオブジェクトを生成する。

```js
flip.next() :FlipPlayer
```
画像を次へ切り替える。

```js
flip.prev() :FlipPlayer
```
画像を前へ切り替える。

```js
flip.reset() :FlipPlayer
```
画像を最初の状態に戻す。

```js
flip.stop() :FlipPlayer
```
自動再生中の画像を停止する。

```js
flip.jump(index :number|string [, isReverse :boolean]) :FlipPlayer
```
指定した画像のインデックスへフレームを切り替える。  
callbackオプションに与える関数内では適切に動作しない。  
インデックスには画像パスを指定することも可能。  
現在のインデックスから次に見つかった対象へジャンプする。  
isReverseが真の場合は後ろから検索を行う。

```js
flip.setIndex(index :number|string [, isReverse :boolean]) :FlipPlayer
```
現在の画像のインデックスを切り替える。  
flip.jumpとは異なり、変更後のフレームが即時に反映されない。  
callbackオプションに与える関数内で使用できる。  
インデックスに画像パスを設定した場合の検索処理はflip.jumpと同様。

```js
flip.index :number
```
現在の画像のインデックスを取得する。

```js
flip.count :number
```
フレーム全体の枚数を取得する。

## その他
Author: YOS G-spec (http://yosgspec.web.fc2.com/)  
License: CC0 (パブリックドメイン)
