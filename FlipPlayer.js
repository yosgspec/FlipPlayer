/*******************************************************************************
# FlipPlayer.js
Author: YOS G-spec (http://yosgspec.web.fc2.com/)
License: CC0 (パブリックドメイン)

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

*******************************************************************************/

var FlipPlayer=function(){
	"use strict";
	var $=FlipPlayer.prototype;

	var pvt=0;
	var _player="#"+(++pvt);
	var _frames="#"+(++pvt);
	var _frameTime="#"+(++pvt);
	var _jumpURL="#"+(++pvt);
	var _background="#"+(++pvt);
	var _index="#"+(++pvt);
	var _forStart="#"+(++pvt);
	var _forFrom="#"+(++pvt);
	var _forI="#"+(++pvt);
	var _isAuto="#"+(++pvt);
	var _isEnded="#"+(++pvt);
	var _callback="#"+(++pvt);
	var _makeImgs="#"+(++pvt);
	var _setKeyEvents="#"+(++pvt);
	var _setFrame="#"+(++pvt);
	var _auto="#"+(++pvt);
	var _end="#"+(++pvt);
	var _playing="#"+(++pvt);
	var _playingLoop="#"+(++pvt);
	var _next="#"+(++pvt);

	function FlipPlayer(id,frames,options){
		this[_player]=document.getElementById(id);
		this[_frames]=frames.slice();
		var cd=options? options.cd||"": "";
		if(cd.slice(-1)!="/") cd=cd+"/";
		this[_frameTime]=options? options.frameTime||1000/12: 1000/12;
		this[_jumpURL]=options? options.jumpURL||null: null;
		var background=options? options.background||null: null;
		var isPixelated=options? options.isPixelated||true: true;
		this[_callback]=options? options.callback||null: null;
		if(options && options.keyEvents) this[_setKeyEvents](options.keyEvents);

		this[_makeImgs](background,isPixelated,cd);

		this.reset();
	}

	Object.defineProperties($,{
		index:{get:function(){return this[_index];}},
		frames:{get:function(){return this[_frames];}},
		count:{get:function(){return this[_frames].length;}}
	});

	$[_makeImgs]=function(background,isPixelated,cd){
		var div=this[_player];
		div.tabIndex=0;
		div.style.display="none";
		div.style.position="relative";
		div.style.userSelect="none";
		div.style.outline="none";
		var baseId=div.id+"_";
		var width=div.style.width!=""? "width:"+div.style.width+";": ""
		var height=div.style.height!=""? "height:"+div.style.height+";": ""
		var addImg=function(path,isFirst){
			if(document.getElementById(baseId+path)!=null) return;
			div.insertAdjacentHTML("beforeend",
				'<img id="'+baseId+path+'" src="'+cd+path+'" style="'+
					"position:"+(isFirst? "relative": "absolute")+";"+
					"visibility:hidden;"+
					"z-index:1;"+
					"left:0px;top:0px;"+
					width+height+
					(!isPixelated? "":
						"image-rendering:pixelated;"+
						"image-rendering:crisp-edges;"+
						"-ms-interpolation-mode:nearest-neighbor;")+
				'">');
		};

		for(var i=0;i<this[_frames].length;i++){
			if(0<=["for","next"].indexOf(this[_frames][i][0].toLowerCase())) continue;
			addImg(this[_frames][i][0],i===0);
		}

		if(background){
			addImg(background,false);
			var bg=document.getElementById(baseId+background);
			bg.style.zIndex="0";
			bg.style.visibility="";
		}
		window.addEventListener("load",function(){
			div.style.display="inline-block";
		});
	}

	$[_setKeyEvents]=function(events){
		var defEvents={
			next: {
				event: "keyup",
				keys: ["z","Z"," ","Spacebar","Enter","ArrowRight","Right"],
				onKeys: this.next.bind(this)
			},
			skip: {
				event: "keydown",
				keys: ["x","X"],
				onKeys: this.next.bind(this)
			},
			prev: {
				event: "keyup",
				keys: ["Backspace","ArrowLeft","Left"],
				onKeys: function(){return this.prev().stop()}.bind(this)
			},
			stop: {
				event: "keyup",
				keys: ["p","P","ArrowDown","Down"],
				onKeys: this.stop.bind(this)
			},
			reset: {
				event: "keyup",
				keys: ["t","T","Escape","Esc","ArrowUp","Up"],
				onKeys: this.reset.bind(this)
			}
		};

		Object.keys(defEvents).forEach(function(i){
			var keys=i+"Keys";
			var onKeys="on"+i[0].toUpperCase()+i.slice(1)+"Keys";
			if(!(keys in events)) events[keys]=defEvents[i].keys;
			if(!(onKeys in events)) events[onKeys]=defEvents[i].onKeys;
			if(events[keys]===null || events[onKeys]===null) return;

			this[_player].addEventListener(defEvents[i].event,function(e){
				e.preventDefault();
				e.stopPropagation();
				if(0<=events[keys].indexOf(e.key)) events[onKeys]();
			});
		}.bind(this));
	}

	$[_setFrame]=function(frame){
		var img=0;
		var baseId=this[_player].id+"_";
		frame=baseId+frame;
		var frames=this[_frames];
		document.getElementById(frame).style.visibility="visible";
		setTimeout(function(){
			var img=0;
			for(var i=0;i<frames.length;i++){
				if(0<=["for","next"].indexOf(frames[i][img].toLowerCase())) continue;
				var f=document.getElementById(baseId+frames[i][img]);
				if(f.id===frame) continue;
				f.style.visibility="hidden";
			}
		},1);
	}

	$[_auto]=function(isAuto){
		this[_isAuto]=isAuto;
		this[_player].style.cursor=isAuto? "": "pointer";
	};

	$.reset=function(){
		this[_index]=0;
		this[_isEnded]=false;
		this[_next]();
		return this;
	};

	$[_end]=function(){
		this[_isEnded]=true;
		this[_next]();
	};

	$[_playing]=function(){
		var img=0;
		var times=1;

		if(this[_frames].length<=this[_index]) return this[_end]();

		var frame=this[_frames][this[_index]];
		if(frame[img].toLowerCase()==="for"){
			this[_index]++;
			this[_forI]=0;
			this[_forFrom]=frame[times];
			this[_forStart]=this[_index];
			frame=this[_frames][this[_index]];
		}
		if(frame[img].toLowerCase()==="next"){
			this[_forI]++;
			if(this[_forI]<this[_forFrom]){
				this[_index]=this[_forStart];
			}
			else{
				this[_index]++;
			}
			frame=this[_frames][this[_index]];
		}

		if(this[_callback]!==null){
			this[_callback](this,this[_index],this[_frames]);
			frame=this[_frames][this[_index]];
		}

		this[_setFrame](frame[img]);

		this[_auto](0<frame[times]);
		this[_index]++;

		this[_playingLoop]=setTimeout(
			function(){
				if(!this[_isAuto]) return;
				this[_playing]();
			}.bind(this)
			,this[_frameTime]*frame[times]);
	};

	$[_next]=function(){
		if(this[_isEnded]){
			if(this[_jumpURL]===null) return this.reset();
			return window.open(this[_jumpURL],"_self");
		}
		this[_playing]();
	};

	$.next=function(){
		if(this[_isAuto]) return this;
		this[_next]();
		return this;
	};

	$.prev=function(){
		var img=0;
		var index=this[_index];
		index-=2;
		while(0<=index && 0<=["for","next"].indexOf(this[_frames][index][img].toLowerCase())) index--;
		this[_index]=0<=index? index: 0;
		this[_next]();
		return this;
	};

	$.jump=function(indexOrFrame,isReverse){
		clearTimeout(this[_playingLoop]);
		this.setIndex(indexOrFrame,isReverse);
		this[_next]();
		return this;
	};

	$.stop=function(){
		this[_auto](false);
		return this;
	};

	$.setIndex=function(indexOrFrame,isReverse){
		var index;
		if("number"===(typeof indexOrFrame) && !isNaN(indexOrFrame)){
			index=indexOrFrame;
			if(this[_frames].length<=index) throw new RangeError();
		}
		else{
			var frame=indexOrFrame;
			index=-1;
			if(isReverse){
				for(var i=this[_frames].length-1;0<=i;i--){
					if(this[_frames][i][0]===frame){
						index=i;
						break;
					}
				}
			}
			else{
				for(var i=0;i<this[_frames].length;i++){
					if(this[_frames][i][0]===frame){
						index=i;
						break;
					}
				}
			}
			if(index<0) throw new TypeError();
		}
		this[_index]=index;
		return this;
	};

	return FlipPlayer;
}();
