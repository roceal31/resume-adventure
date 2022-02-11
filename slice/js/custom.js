var loader;
var canvas = document.getElementById('game-map');
canvas.setAttribute('width', $(canvas).css('min-width').replace(/\D/g, ''));
canvas.setAttribute('height', $(canvas).css('min-height').replace(/\D/g, ''));
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
		mapConfig: settings.mapConfig,
		zoneId: '',

		s: function() {
			return (0 - q - r);
		},

		init: function() {
			this.calculateHexHeight();
			this.drawHex(this.startX, this.startY);
			//this.drawCoords(this.startX, this.startY, this.q, this.r);
			this.screen = hexTileObj.center();
			if(this.mapConfig.zoneId) {
				this.zoneId = this.mapConfig.zoneId;
			}
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
			this.context.fillStyle = 'black';
			this.context.textAlign = 'center';
			this.context.font = '7px sans-serif';
			var x = startX + (this.hexWidthUnit / 2);
			var y = startY + this.hexHeightUnit + 4;
			this.context.fillText(q + ',' + r, x, y);
		},

		drawHex: function(startX, startY) {
			this.context.strokeStyle = this.mapConfig.strokeStyle;
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
			return [x,currentY];
		},

		drawSideTwo: function(currentX, currentY) {
			var x = currentX + (this.hexWidthUnit/2);
			var y = currentY + this.hexHeightUnit;
			this.context.lineTo(x, y);
			return [x,y];
		},

		drawSideThree: function(currentX, currentY) {
			var x = currentX - (this.hexWidthUnit/2);
			var y = currentY + this.hexHeightUnit;
			this.context.lineTo(x, y);
			return [x,y];
		},

		drawSideFour: function(currentX, currentY) {
			var x = currentX - this.hexWidthUnit;
			this.context.lineTo(x, currentY);
			return [x, currentY];
		},

		drawSideFive: function(currentX, currentY) {
			var x = currentX - (this.hexWidthUnit/2);
			var y = currentY - this.hexHeightUnit;
			this.context.lineTo(x, y);
		},

		drawSideSix: function(startX, startY) {
			this.context.closePath(startX, startY);
			this.context.fillStyle = this.mapConfig.fillStyle;
			this.context.fill();
			this.context.stroke();
		},

		calculateHexHeight: function() {
			var hyp = Math.pow(this.hexWidthUnit, 2);
			var base = Math.pow(this.hexWidthUnit/2, 2);
			this.hexHeightUnit = Math.sqrt(hyp - base);
		}
	};

	//console.log('New hex tile', hexTileObj);
	return hexTileObj;
}

var mapTile = function(settings) {
	var tileObj = {
		strokeStyle: settings.strokeStyle || 'rgb(94,94,94)',
		fillStyle: settings.fillStyle || 'rgb(61,166,0)',
		zoneId: settings.zoneId
	};

	return tileObj;
}

var map = function(settings) {
	console.log('map factory');
	var mapObj = {
		context: settings.context,
		grid: settings.grid,
		/*
		   zones array elements: see mapZone factory function
		 */
		zones: [
			mapZone({
				id: 'forest',
				context: this.context,
				title: 'The Pursuant Forest',
				logMessage: 'Forest blah blah blah lorem ipsum dolor sit amet.',
				image: '/slice/images/forest-sprite.png',
				imageCoords: [420,24]
			})
		],
		/*
		   Map array elements:
		     - null = empty space on the grid, default hexTile
		     - mapTile = custom object to pass to hexTile with fill colour & zone id
		 */
		mapArray: [],

		init: function(zones, mapArray) {
			if(zones) {
				this.zones = zones;				
			}
			this.mapArray = mapArray;
		},

		getZoneById: function(zoneId) {
			var mapZone = this.zones.find(function(zone) {
				return zone.id == zoneId;
			});
			return mapZone;
		},

		getZoneByCoordinates: function(q, r) {
			var mapTile = this.mapArray[q][r];
			if(mapTile.zoneId) {
				return this.getZoneById(mapTile.zoneId);
			}
			return null;
		},
	};

	console.log('map factory built', mapObj);
	return mapObj;
}

// Full game hex grid factory function
var hexGrid = function(context) {
	var gridObj = {
		hexTiles: [],
		map: map({context:context}),
		context: context,
		gridSize: 10,
		hexHeightUnit: 0,
		width: 0,
		height: 0,

		init: function(mapArray) {
			//console.log('hexGrid init, initialising map', mapArray);
			this.map.context = this.context;
			this.map.grid = this;
			this.map.init(null, mapArray);

			var canvas = $(context.canvas);
			this.width = parseInt(canvas.prop('width'));
			this.height = parseInt(canvas.prop('height'));

			var hyp = Math.pow(this.gridSize, 2);
			var base = Math.pow(this.gridSize/2, 2);
			this.hexHeightUnit = Math.sqrt(hyp - base);

			var middleX = this.width / 2;
			var middleY = this.height / 2;

			var numberRows = Math.floor(this.height / this.hexHeightUnit);
			var numberCols = Math.floor(this.width / (this.gridSize * 2));
			this.hexTiles = new Array(numberCols);

			// Even columns
			var currentX = this.gridSize / 2;
			var currentY = 0;
			this.buildHexGrid(0, currentX, currentY, numberRows, numberCols);

			// Odd columns
			currentX = this.gridSize * 2;
			currentY = this.hexHeightUnit;
			this.buildHexGrid(1, currentX, currentY, numberRows, numberCols);

			this.buildMapZones();
		},

		buildHexGrid: function(colStart, startX, startY, numberRows, numberCols) {
			var q = colStart, r = 0;
			var currentX = startX, currentY = startY;
			while(currentY < (this.height - this.hexHeightUnit)) {
				while(currentX < (this.width - (this.gridSize))) {
					var mapConfig = mapTile({});
					if(this.map.mapArray[q] && this.map.mapArray[q][r]) {
						mapConfig = mapTile(this.map.mapArray[q][r]);
					}
					//console.log('buildHexGrid', mapConfig);
					var currentTile = hexTile({
						context: this.context,
						q: q,
						r: r,
						x: currentX,
						y: currentY,
						gridSize: this.gridSize,
						mapConfig: mapConfig
					});
					if(this.hexTiles[q] === undefined) {
						this.hexTiles[q] = new Array(numberRows);
					}
					this.hexTiles[q][r] = currentTile;
					currentTile.init();
					currentX = currentX + (this.gridSize * 3);
					q += 2;
				}
				currentY = currentY + (this.hexHeightUnit * 2);
				r++;
				currentX = startX;//this.gridSize / 2;
				q = colStart;
			}
		},

		buildMapZones: function() {
			console.log('buildMapZones', this.map);
			var mapZoneCount = this.map.zones.length;
			for(var i = 0; i < mapZoneCount; i++) {
				var zone = this.map.zones[i];
				console.log('Drawing zone', zone);
				zone.init(420, 24);
			}
		},

		refreshTiles: function(startTile) {
			var startCol = startTile.q - 2;
			var endCol = startCol + 5;
			var startRow = startTile.r - 3;
			var endRow = startTile.r + 1;
			var zone = null;

			for(var col = startCol; col < endCol; col++) {
				for(var row = startRow; row <= endRow; row++) {
					var currTile = this.hexTiles[col][row];
					currTile.init();
					if(currTile.zoneId) {
						zone = currTile.zoneId;
					}
				}
			}
			if(zone !== null) {
				this.refreshZone(zone);
			}
		},

		refreshZone: function(zoneId) {
			var zone = this.map.getZoneById(zoneId);
			zone.drawBackgroundImage();
		},

		isTileOnMap: function(hexTile) {
			return (this.map.mapArray[hexTile.q][hexTile.r] != null);
		},

		isTileInZone: function(hexTile) {

		}

	}

	return gridObj;
}

// Interactive zone factory function
var mapZone = function(settings) {
	var zoneObj = {
		id: settings.id || '',
		title: settings.title || '',
		grid: settings.grid,
		context: settings.context,
		logMessage: settings.logMessage || '',
		// TODO: image assets, monster, and zone state
		imagePath: settings.image || '',
		image: {},
		imageCoords: settings.imageCoords || [],
		monster: {},
		state: 0,

		init: function(x, y) {
			this.image = new Image();
			this.image.src = this.imagePath;
			console.log('mapZone init', this.image);

			var zone = this;
			$(this.image).on('load', function() {
				zone.drawBackgroundImage();
			});
		},

		drawBackgroundImage() {
			//console.log('mapZone drawBackgroundImage', this.context, this.image);
			if(this.context && this.image.src) {
				this.context.drawImage(this.image, this.imageCoords[0], this.imageCoords[1]);
			}
		},

		drawTitle: function() {
			// TODO
		}
	};

	return zoneObj;
}

// Adventurer factory function
var adventurer = function(settings) {
	var advObj = {
		position: settings.position, // current hex tile in the grid
		grid: settings.grid,
		frameIndex: 0,
		tickCount: 0,
		ticksPerFrame: settings.ticksPerFrame || 8,
		ticksPerMove: settings.ticksPerMove || 4,
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
				this.movingTo = this.getNextPosition(direction);
				if(this.canMoveToTile(this.movingTo)) {
					this.direction = direction;
					this.isMoving = true;
				}
			}
		},

		canMoveToTile: function(hexTile) {
			var newPositionOnMap = this.grid.isTileOnMap(hexTile);
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
			//thisAdventurer.direction = 0;
			this.position = this.movingTo;
			this.movingTo = null;
		},
	};

	return advObj;
};

// Main game  object factory function
var game = function(settings) {
	var gameObj = {
		grid: {},
		adventurer: {},
		console: {},
		log: {},
		context: settings.context,

		init: function(initMessage, mapArray) {
			this.console = $('#game-console');
			this.log = $('#game-log');
			this.log.html('<p>' + initMessage + '</p>');

			this.grid = hexGrid(context);
			this.grid.init(mapArray);

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
			this.grid.refreshTiles(this.adventurer.position);
			this.adventurer.render();
		},

	};

	return gameObj;
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

function handleMapLoad(data, status, xhr) {
	//console.log('handleMapLoad', data);
	initScene(data.mapArray);
}

function loadGame() {
	jQuery.get({
		url: '/slice/js/mapArray.json',
		dataType: 'json',
		success: handleMapLoad
	});
	$(loader).hide('scale', 600, function() {
		$(document).off('keypress', handleLoadingKeypress);
		$(document).off('keydown', handleLoadingKeypress);
	});
}

function initScene(mapArray) {
	//console.log('initScene', mapArray);
	currentGame = game({
		context: context

	});

	currentGame.init('You find yourself standing at a dusty crossroads. Five paths '+
		'stretch away into the distance. You suppose you must choose a direction ' +
		'and start moving. Adventure isn\'t going to find itself!', mapArray);

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
  $.get( "js/mapArray.json", handleMapLoad, "json" ).error(function(err) {
  	console.log('error', err);
  });
});