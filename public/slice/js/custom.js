var loader;
var canvas = document.getElementById('game-map');
var context = canvas ? canvas.getContext('2d') : null;

var currentMap;

var mapCoords = [
	{
		axial: [0, 0],
		screen: [10,8] // middle of hex tile
	},

	{
		axial: [0, 1],
		screen: [10, 24] // + 0, + 16
	},

	{
		axial: [1,0],
		screen: [23, 16] // + 13, +8
	}
];

var currentAdventurer;

var requestAnimFrame = window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.msRequestAnimationFrame ||
	window.mozRequestAnimationFrame;

// TODO: implement hex grid & start adventurer at middle of map
var coordinates = function() {
	return {
		axial: {q: 0, r:0, s:0 },
		screen: [504, 333]
	}
};

var map = function(settings) {
	var mapObj = {
		mapImage: {},
		map: {},
		context: settings.context,

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
				this.context.drawImage(this.mapImage, 1, 10);
			}
		},

		isPointOnMap: function(x, y) {
			if(this.context) {
				console.log('is point on map', x, y);
				var imgData = this.context.getImageData(x, y, 1, 1);
				var isOpaque = (imgData.data[3] != 0);
				return isOpaque;
			}

			return false;
		},

	};

	return mapObj;
}

var adventurer = function(settings) {
	var obj = {
		position: coordinates(),
		frameIndex: 0,
		tickCount: 0,
		ticksPerFrame: settings.ticksPerFrame || 8,
		isMoving: false,
		direction: settings.direction || 0, // 0 = down, 1 = left, 2 = up, 3 = right
		movingTo: {},
		context: {},
		image: {},
		map: {},
		width: settings.width || 32,
		height: settings.height || 32,

		init: function() {
			console.log('adventurer init', this);
			this.image = new Image();
			this.image.src = '/slice/images/adventurer-sprite.png';
			var thisAdventurer = this;
			this.image.onload = function() {
				thisAdventurer.render();
			};
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
					this.position.screen[0], // map location x coordinate
					this.position.screen[1], // map location y coordinate
					this.width, // image width
					this.height // image height
				);
			}
		},

		update: function() {
			// cycle through animation
			if(this.isMoving) {
				this.tickCount += 1;
				if(this.tickCount > this.ticksPerFrame) {
					this.tickCount = 0;
					this.frameIndex = (this.frameIndex + 1) % 8;
				}
			}
		},

		move: function(direction) {
			var newPositionX = this.getNextPositionX(direction) + 16;
			var newPositionY = this.getNextPositionY(direction) + this.height;
			var newPositionOnMap = this.map.isPointOnMap(newPositionX, newPositionY);
			if(newPositionOnMap) {
				this.isMoving = true;
				this.direction = direction;
				this.clear();
				this.updatePosition(direction);
				window.setTimeout(this.stop, 1200, this);
			}
		},

		clear: function() {
			if(this.context) {
				this.context.clearRect(this.position.screen[0],
					this.position.screen[1],
					this.width,
					this.height);
			}
		},

		updatePosition: function(direction) {
			// for now let's just brute force this thing
			// TODO: make this elegant with an actual coordinate
			// calculation
			switch(direction) {
				case 2: // up
				this.position.screen[1] -= 16;
				break;

				case 0: // down
				this.position.screen[1] += 16;
				break;

				case 1: // left
				this.position.screen[0] -= 26;
				break;

				case 3: // right
				this.position.screen[0] += 26;
				break;
			}
		},

		getNextPositionX: function(direction) {
			switch(direction) {
				case 1: // left
				return this.position.screen[0] - 26;

				case 3: // right
				return this.position.screen[0] + 26;				
			}

			return this.position.screen[0];

		},

		getNextPositionY: function(direction) {
			switch(direction) {
				case 2: // up
				return this.position.screen[1] - 16;

				case 0: // down
				return this.position.screen[1] + 16;
			}

			return this.position.screen[1];
		},

		getFeetPosition(x, y) {
			return [Math.round((x + this.width) / 2), (y + this.height)];
		},

		stop: function(thisAdventurer) {
			thisAdventurer.isMoving = false;
			thisAdventurer.frameIndex = 0;
			thisAdventurer.direction = 0;
		},
	};

	if(settings.context) {
		obj.context = settings.context;
	}

	if(settings.location) {
		obj.location = settings.location;
	}

	if(settings.map) {
		obj.map = settings.map;
	}

	return obj;
};

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
		currentAdventurer.move(2);
	}

	if(key === 40) {
		// Move down
		currentAdventurer.move(0);
	}

	if(key === 37) {
		// Move left
		currentAdventurer.move(1);
	}

	if(key === 39) {
		// Move right
		currentAdventurer.move(3);
	}
}

function loadResume() {
	window.location = '/slice/index.html';
}

function loadGame() {
	$(loader).hide('scale', 600, function() {
		$(document).off('keypress', handleLoadingKeypress);
		$(document).off('keydown', handleLoadingKeypress);
		initMap();
	});
}

function initScene() {
	currentMap = map({
		context: context
	});
	currentMap.init();
	currentAdventurer = adventurer({
		context: context,
		map: currentMap,
	});
	currentAdventurer.init();

	$(document).on('keypress', handleGameKeypress);
	$(document).on('keydown', handleGameKeypress);

	gameLoop();
}

function gameLoop() {
	if(currentMap) {
		currentMap.refresh();
	}
	if(currentAdventurer) {
		currentAdventurer.update();
		currentAdventurer.render();
	}
	requestAnimFrame(gameLoop);
}

$(function() {
  initTooltips();
  //initGame();
  initScene();
});