var loader;
var canvas = document.getElementById('game-map');
canvas.setAttribute('width', $(window).width());
canvas.setAttribute('height', $(window).height());
var context = canvas ? canvas.getContext('2d') : null;

var currentGame;

var requestAnimFrame = window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.msRequestAnimationFrame ||
	window.mozRequestAnimationFrame;

// Individual hex factory function
var hexTile = function(settings) {
	var hexTileObj = {
		context: settings.context,
		q: settings.q || 0,
		r: settings.r || 0,
		startX: settings.x,
		startY: settings.y,
		screen: [],
		hexHeightUnit: 0,
		hexWidthUnit: settings.gridSize || 10,
		strokeStyle: settings.strokeStyle || 'rgb(94,94,94)',
		fillStyle: settings.fillStyle || 'transparent',

		s: function() {
			return (0 - q - r);
		},

		center: function() {
			if(!this.hexHeightUnit) {
				this.calculateHexHeight();
			}
			var centerX = this.startX + (this.hexWidthUnit / 2);
			var centerY = this.startY + this.hexHeightUnit;
			return [centerX, centerY];
		},

		drawCoords: function(startX, startY, q, r) {
			this.context.fillStyle = 'lightgray';
			this.context.textAlign = 'center';
			this.context.font = '6px sans-serif';
			var x = startX + (this.hexWidthUnit / 2);
			var y = startY + this.hexHeightUnit + 4;
			this.context.fillText(q + ',' + r, x, y);
		},

		drawHex: function(startX, startY) {
			this.context.strokeStyle = this.strokeStyle;
			var currentPoint = this.drawSideOne(startX, startY);
			currentPoint = this.drawSideTwo(currentPoint[0], currentPoint[1]);
			currentPoint = this.drawSideThree(currentPoint[0], currentPoint[1]);
			currentPoint = this.drawSideFour(currentPoint[0], currentPoint[1]);
			this.drawSideFive(currentPoint[0], currentPoint[1]);
			this.drawSideSix(startX, startY);
		},

		drawSideOne: function(currentX, currentY) {
			this.context.beginPath();
			this.context.moveTo(currentX, currentY); // starting point of hexagon
			var x = currentX + this.hexWidthUnit;
			this.context.lineTo(x, currentY); // second point of hexagon
			//this.context.stroke(); // draws top horizontal line
			return [x,currentY];
		},

		drawSideTwo: function(currentX, currentY) {
			var x = currentX + (this.hexWidthUnit/2);
			var y = currentY + this.hexHeightUnit;
			this.context.lineTo(x, y);
			//this.context.stroke();
			return [x,y];
		},

		drawSideThree: function(currentX, currentY) {
			var x = currentX - (this.hexWidthUnit/2);
			var y = currentY + this.hexHeightUnit;
			this.context.lineTo(x, y);
			//this.context.stroke();
			return [x,y];
		},

		drawSideFour: function(currentX, currentY) {
			var x = currentX - this.hexWidthUnit;
			this.context.lineTo(x, currentY);
			//this.context.stroke();
			return [x, currentY];
		},

		drawSideFive: function(currentX, currentY) {
			var x = currentX - (this.hexWidthUnit/2);
			var y = currentY - this.hexHeightUnit;
			this.context.lineTo(x, y);
			//this.context.stroke();
		},

		drawSideSix: function(startX, startY) {
			this.context.closePath(startX, startY);
			this.context.fillStyle = this.fillStyle;
			this.context.fill();
			this.context.stroke();
		},

		calculateHexHeight: function() {
			var hyp = Math.pow(this.hexWidthUnit, 2);
			var base = Math.pow(this.hexWidthUnit/2, 2);
			this.hexHeightUnit = Math.sqrt(hyp - base);
		}
	};

	hexTileObj.calculateHexHeight();
	hexTileObj.drawHex(settings.x, settings.y);
	//hexTileObj.drawCoords(settings.x, settings.y, settings.q, settings.r);
	hexTileObj.screen = hexTileObj.center();
	return hexTileObj;
}

// Full game hex grid factory function
var hexGrid = function(context) {
	var gridObj = {
		hexTiles: [],
		mapTiles: [null, null, null, null, null, null,
			[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null, null, null, null, 'rgb(169, 168, 121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null, null, null, null, 'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,'rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)',null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)','rgb(169,168,121)'],
		    [null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,'rgb(169,168,121)','rgb(169,168,121)'],
		    ],
		context: context,
		gridSize: 10,
		hexHeightUnit: 0,
		width: 0,
		height: 0,

		init: function() {
			var canvas = $(context.canvas);
			this.width = parseInt(canvas.prop('width'));
			this.height = parseInt(canvas.prop('height'));

			var hyp = Math.pow(this.gridSize, 2);
			var base = Math.pow(this.gridSize/2, 2);
			this.hexHeightUnit = Math.sqrt(hyp - base);

			var middleX = this.width / 2;
			var middleY = this.height / 2;

			var currentX = this.gridSize / 2;
			var currentY = 0;

			var numberRows = Math.floor(this.height / this.hexHeightUnit);
			var numberCols = Math.floor(this.width / (this.gridSize * 2));
			this.hexTiles = new Array(numberCols);

			var q = 0, r = 0;
			while(currentY < (this.height - this.hexHeightUnit)) {
				while(currentX < (this.width - (this.gridSize))) {
					var fillStyle = null;
					if(this.mapTiles[q] && this.mapTiles[q][r]) {
						fillStyle = this.mapTiles[q][r];
					} 
					var currentTile = hexTile({
						context: this.context,
						q: q,
						r: r,
						x: currentX,
						y: currentY,
						gridSize: this.gridSize,
						fillStyle: fillStyle,
					});
					if(this.hexTiles[q] === undefined) {
						this.hexTiles[q] = new Array(numberRows);
					}
					this.hexTiles[q][r] = currentTile;
					currentX = currentX + (this.gridSize * 3);
					q += 2;
				}
				currentY = currentY + (this.hexHeightUnit * 2);
				r++;
				currentX = this.gridSize / 2;
				q = 0;
			}

			currentX = this.gridSize * 2;
			currentY = this.hexHeightUnit;
			q = 1; r = 0;
			while(currentY < (this.height - this.hexHeightUnit)) {
				while(currentX < (this.width - (this.gridSize))) {
					var fillStyle = null;
					if(this.mapTiles[q] && this.mapTiles[q][r]) {
						fillStyle = this.mapTiles[q][r];
					} 
					var currentTile = hexTile({
						context: this.context,
						q: q,
						r: r,
						x: currentX,
						y: currentY,
						gridSize: this.gridSize,
						fillStyle: fillStyle,
					});
					if(this.hexTiles[q] === undefined) {
						this.hexTiles[q] = new Array(numberRows);
					}
					this.hexTiles[q][r] = currentTile;
					currentX = currentX + (this.gridSize * 3);
					q += 2;
				}
				currentY = currentY + (this.hexHeightUnit * 2);
				r++;
				currentX = this.gridSize * 2;
				q = 1;
			}
			
		},

	}

	return gridObj;
}

// Adventurer factory function
var adventurer = function(settings) {
	var obj = {
		position: settings.position, // current hex tile in the grid
		grid: settings.grid,
		frameIndex: 0,
		tickCount: 0,
		ticksPerFrame: settings.ticksPerFrame || 8,
		ticksPerMove: settings.ticksPerMove || 1,
		isMoving: false,
		direction: settings.direction || 0, // 0 = down, 1 = left, 2 = up, 3 = right
		movingTo: {}, // hex tile to move to
		context: settings.context,
		image: {},
		width: settings.width || 32,
		height: settings.height || 32,
		screenCoords: [],

		init: function() {
			this.image = new Image();
			this.image.src = '/slice/images/adventurer-sprite.png';
			var thisAdventurer = this;
			this.screenCoords = this.calculateScreenPosition(this.position);
			this.image.onload = function() {
				thisAdventurer.render();
			};
		},

		calculateScreenPosition: function(hexTile) {
			var hexCenter = hexTile.screen;
			var x = Math.ceil(hexCenter[0] - (this.width / 2));
			var y = Math.ceil(hexCenter[1] - this.height);
			return [x,y];
		},

		render: function() {
			if(this.context && this.image.src) {
				var sx = this.frameIndex * this.width;
				var sy = this.direction * this.height;
				this.context.drawImage(this.image,
					sx, // start clip x coordinate
					sy, // start clip y coordinate
					this.width, // clip width
					this.height, // clip height
					this.screenCoords[0], // current position x coordinate
					this.screenCoords[1], // current position y coordinate
					this.width, // image width
					this.height // image height
				);
				/* Debug position
				this.context.fillStyle = 'red';
				this.context.fillRect(this.position.screen[0], this.position.screen[1], 2, 2);

				var feetX = this.position.screen[0] + 16;
				var feetY = this.position.screen[1] + this.height;
				this.context.fillStyle = 'blue';
				this.context.fillRect(feetX, feetY, 2, 2);
				*/
			}
		},

		update: function() {
			// cycle through animation
			if(this.isMoving) {
				this.tickCount += 1;
				if(this.tickCount > this.ticksPerMove) {
					this.updatePosition();
				}
				if(this.tickCount > this.ticksPerFrame) {
					this.tickCount = 0;
					this.frameIndex = (this.frameIndex + 1) % 8;
				}
			}
		},

		move: function(direction) {
			if(!this.isMoving) {
				this.direction = direction;
				this.movingTo = this.getNextPosition(direction);
				this.isMoving = true;
				this.direction = direction;
				/*
				this.movingTo[0] = this.getNextPositionX(direction);
				this.movingTo[1] = this.getNextPositionY(direction);
				if(this.canMoveToPoint(this.movingTo[0], this.movingTo[1])) {
					this.isMoving = true;
					this.direction = direction;
					//window.setTimeout(this.stop, 1200, this);
				}
				*/
			}
		},

		canMoveToPoint: function(newX, newY) {
			this.clear();
			var newPositionOnMap = this.map.isPointOnMap(newX + 16, newY + this.height);
			this.render();
			return newPositionOnMap;
		},

		clear: function() {
			if(this.context) {
				this.context.clearRect(this.screenCoords[0],
					this.screenCoords[1],
					this.width,
					this.height);
			}
		},

		updatePosition: function() {
			var endPoint = this.calculateScreenPosition(this.movingTo);
			//console.log('updatePosition', this.screenCoords, endPoint);
			if(this.screenCoords[0] == endPoint[0] && this.screenCoords[1] == endPoint[1]) {
				this.stop(this);
			} else {
				this.screenCoords[0] = (this.screenCoords[0] < endPoint[0]) ?
					this.screenCoords[0] + 1 : (this.screenCoords[0] > endPoint[0]) ?
						this.screenCoords[0] - 1 : this.screenCoords[0];
				this.screenCoords[1] = (this.screenCoords[1] < endPoint[1]) ?
					this.screenCoords[1] + 1 : (this.screenCoords[1] > endPoint[1]) ?
						this.screenCoords[1] - 1 : this.screenCoords[1];
			}
		},

		getNextPosition(direction) {
			var nextQ = this.position.q;
			var nextR = this.position.r;
			switch(direction) {

				case 1: // left
					nextQ--;
					break;

				case 2: // up
					nextR--;
					break;

				case 3: // right
					nextQ++;
					break;

				case 0: // down
					nextR++;
					break;
			}

			//console.log('getNextPosition', nextQ, nextR, this.grid.hexTiles[nextQ][nextR]);
			return this.grid.hexTiles[nextQ][nextR];
		},

		getFeetPosition(x, y) {
			return [Math.round((x + this.width) / 2), (y + this.height)];
		},

		stop: function(thisAdventurer) {
			thisAdventurer.isMoving = false;
			thisAdventurer.frameIndex = 0;
			thisAdventurer.direction = 0;
			this.position = this.movingTo;
			this.movingTo = null;
		},
	};

	return obj;
};

var game = function(settings) {
	var gameObj = {
		grid: {},
		adventurer: {},
		console: {},
		log: {},
		context: settings.context,

		init: function(initMessage) {
			this.console = $('#game-console');
			this.log = $('#game-log');
			this.log.html('<p>' + initMessage + '</p>');

			this.grid = hexGrid(context);
			this.grid.init();

			this.adventurer = adventurer({
				context: this.context,
				position: this.grid.hexTiles[39][23],
				grid: this.grid,
			});
			this.adventurer.init();
		},

		logMessage: function(message) {
			var currentLog = this.log.html();
			this.log.html(currentLog + '<p>' + message + '</p>');
		},

		updateGame: function() {
			this.adventurer.clear();
			this.adventurer.update();
			this.grid.init();
			this.adventurer.render();
		},

	};

	return gameObj;
}

// Map factory function
/*
var map = function(settings) {
	var mapObj = {
		mapImage: {},
		map: {},
		context: settings.context,
		grid: {},

		init: function() {
			this.mapImage = new Image();
			this.mapImage.src = '/slice/images/map.png';
			var thisMap = this;
			this.mapImage.onload = function () {
				thisMap.refresh();
			};
			
			this.map = $(canvas);
			if(canvas && !this.map.is(':visible')) {
				this.map.show('scale', 600);
			}

		},

		refresh: function() {
			if(this.context && this.mapImage) {
				this.context.drawImage(this.mapImage, 0, 0);

				this.grid = hexGrid(this.context);
				this.grid.init();
				console.log('grid created', this.grid);

			}
		},

		isPointOnMap: function(x, y) {
			if(this.context) {
				this.refresh();
				var imgData = this.context.getImageData(x, y, 1, 1);
				var isOpaque = (imgData.data[3] != 0);
				return isOpaque;
			}

			return false;
		},

	};

	return mapObj;
}
*/

// Interactive zone factory function
var mapZone = function(settings) {
	var zoneObj = {
		position: {
			screen: [0,0]
		},
		image: {},
		context: {},
		width: {},
		height: {},
		monster: {},
		state: {},
	};

	return zoneObj;
}

function formatTooltipTitle() {
  var data = $(this).attr('data-title');
  data = data.replace(/;/g, '<br>');
  return data;
}

function initTooltips() {
  var tooltips = $('div[data-toggle="tooltip"]').tooltip({
    title: formatTooltipTitle,
    html: true,
  });
}

function initGame() {
	loader = $('#loading-screen');
	if(loader && loader.length && !loader.is(':visible')) {
		loader.show('scale', 800);
		$(document).on('keypress', handleLoadingKeypress);
		$(document).on('keydown', handleLoadingKeypress);
	}
}

function handleLoadingKeypress(eventObject) {
	var key = eventObject.which;

	if(key === 27) { 
		loadResume();
	}

	if(key === 13) {
		loadGame();
	}
}

function handleGameKeypress(eventObject) {
	var key = eventObject.which;

	if([37, 38, 39, 40].indexOf(key) >= 0) {
		eventObject.preventDefault();
	}

	if(key === 38) {
		// Move up
		currentGame.adventurer.move(2);
	}

	if(key === 40) {
		// Move down
		currentGame.adventurer.move(0);
	}

	if(key === 37) {
		// Move left
		currentGame.adventurer.move(1);
	}

	if(key === 39) {
		// Move right
		currentGame.adventurer.move(3);
	}
}

function loadResume() {
	window.location = '/slice/index.html';
}

function loadGame() {
	$(loader).hide('scale', 600, function() {
		$(document).off('keypress', handleLoadingKeypress);
		$(document).off('keydown', handleLoadingKeypress);
		initScene();
	});
}

function initScene() {
	currentGame = game({
		context: context
	});

	currentGame.init('You find yourself standing at a dusty crossroads. Five paths '+
		'stretch away into the distance. You suppose you must choose a direction ' +
		'and start moving. Adventure isn\'t going to find itself!');

	$(document).on('keypress', handleGameKeypress);
	$(document).on('keydown', handleGameKeypress);

	gameLoop();
}

function gameLoop() {
	currentGame.updateGame();
	requestAnimFrame(gameLoop);
}

$(function() {
  initTooltips();
  //initGame();
  initScene();
});