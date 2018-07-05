		//一些路径的转换，花瓣路径的绘制
		function Vector(x, y) {
			this.x = x;
			this.y = y;
		};

		Vector.prototype = {
			rotate: function (theta) {
				var x = this.x;
				var y = this.y;
				this.x = Math.cos(theta) * x - Math.sin(theta) * y;
				this.y = Math.sin(theta) * x + Math.cos(theta) * y;
				return this;
			},
			mult: function (f) {
				this.x *= f;
				this.y *= f;
				return this;
			},
			clone: function () {
				return new Vector(this.x, this.y);
			},
			length: function () {
				return Math.sqrt(this.x * this.x + this.y * this.y);
			},
			subtract: function (v) {
				this.x -= v.x;
				this.y -= v.y;
				return this;
			},
			set: function (x, y) {
				this.x = x;
				this.y = y;
				return this;
			}
		};


		/**
		 *
		 * 花瓣class
		 * render函数比较是否要draw
		 * 
		 * 依据部分参数算出路径并draw
		 */


		function Petal(stretchA, stretchB, startAngle, angle, growFactor, bloom) {
			this.stretchA = stretchA;
			this.stretchB = stretchB;
			this.startAngle = startAngle;
			this.angle = angle;
			this.bloom = bloom;
			this.growFactor = growFactor;
			this.r = 1;
			this.isfinished = false;
			//this.tanAngleA = Garden.random(-Garden.degrad(Garden.options.tanAngle), Garden.degrad(Garden.options.tanAngle));
			//this.tanAngleB = Garden.random(-Garden.degrad(Garden.options.tanAngle), Garden.degrad(Garden.options.tanAngle));
		}
		Petal.prototype = {
			draw: function () {
				// 这里面相关的路径函数表示看不懂，0.0
				var ctx = this.bloom.garden.ctx;
				var v1, v2, v3, v4;
				v1 = new Vector(0, this.r).rotate(Garden.degrad(this.startAngle));
				v2 = v1.clone().rotate(Garden.degrad(this.angle));
				v3 = v1.clone().mult(this.stretchA); //.rotate(this.tanAngleA);
				v4 = v2.clone().mult(this.stretchB); //.rotate(this.tanAngleB);
				ctx.strokeStyle = this.bloom.c;
				ctx.beginPath();
				ctx.moveTo(v1.x, v1.y);
				ctx.bezierCurveTo(v3.x, v3.y, v4.x, v4.y, v2.x, v2.y);
				ctx.stroke();
			},
			render: function () {
				if (this.r <= this.bloom.r) {
					this.r += this.growFactor; // / 10;
					this.draw();
				} else {
					this.isfinished = true;
				}
			}
		}



		/**
		 *
		 * 花朵class
		 * 初始化init
		 * 之后通过draw函数更新花朵中的每个花瓣显示
		 *
		 */


		function Bloom(p, r, c, pc, garden) {
			this.p = p; // position,起始点的位置x，y
			this.r = r; // 花朵半径(8-10)
			this.c = c; // 花朵颜色
			this.pc = pc; // 每朵花中花瓣数量(8-15)
			this.petals = []; // 花瓣数组，根据pc依次添加Petal类到this.petals中
			this.garden = garden; // gardenEl
			this.init();
			this.garden.addBloom(this);
		}
		Bloom.prototype = {
			draw: function () {
				var p, isfinished = true;
				// 保存画板的位置信息
				this.garden.ctx.save();
				this.garden.ctx.translate(this.p.x, this.p.y);
				// 绘制每朵花中的每个花瓣
				for (var i = 0; i < this.petals.length; i++) {
					p = this.petals[i];
					p.render();
					// 每朵花瓣的isfinished想成为true时判断花瓣render完成
					// 但是如果有成双的花瓣未render完成，这时也会提前结束render
					isfinished *= p.isfinished;
				}
				// 重置画板的位置信息
				this.garden.ctx.restore();
				if (isfinished == true) {
					this.garden.removeBloom(this);
				}
			},
			// init函数，根据花瓣的数量依次初始化每个花瓣的信息并添加到this.petals数组中
			init: function () {
				var angle = 360 / this.pc;
				var startAngle = Garden.randomInt(0, 90);
				for (var i = 0; i < this.pc; i++) {
					this.petals.push(new Petal(Garden.random(Garden.options.petalStretch.min, Garden.options.petalStretch.max), Garden.random(Garden.options.petalStretch.min, Garden.options.petalStretch.max), startAngle + i * angle, angle, Garden.random(Garden.options.growFactor.min, Garden.options.growFactor.max), this));
				}
			}
		}

		function Garden(ctx, element) {
			this.blooms = []; // 所有花朵的数组
			this.element = element;
			this.ctx = ctx;
			this.isfinished = false
		}
		Garden.prototype = {
			render: function () {
				// 绘制每朵花
				for (var i = 0; i < this.blooms.length; i++) {
					this.blooms[i].draw();
				}
			},
			// 添加要render的花朵
			addBloom: function (b) {
				this.blooms.push(b);
			},
			// 删除要render的花朵
			removeBloom: function (b) {
				var bloom;
				for (var i = 0; i < this.blooms.length; i++) {
					bloom = this.blooms[i];
					if (bloom === b) {
						this.blooms.splice(i, 1);
						return this;
					}
				}
			},
			// create随机参数的花朵
			createRandomBloom: function (x, y) {
				this.createBloom(x, y, Garden.randomInt(Garden.options.bloomRadius.min, Garden.options.bloomRadius.max), Garden.randomrgba(Garden.options.color.rmin, Garden.options.color.rmax, Garden.options.color.gmin, Garden.options.color.gmax, Garden.options.color.bmin, Garden.options.color.bmax, Garden.options.color.opacity), Garden.randomInt(Garden.options.petalCount.min, Garden.options.petalCount.max));
			},
			// create花朵并调用addBloom()使之添加到要render的列表中
			createBloom: function (x, y, r, c, pc) {
				new Bloom(new Vector(x, y), r, c, pc, this);
			},
			clear: function () {
				this.blooms = [];
				this.ctx.clearRect(0, 0, this.element.width, this.element.height);
			}
		}

		Garden.options = {
			petalCount: {
				min: 8,
				max: 15
			},
			petalStretch: {
				min: 0.1,
				max: 3
			},
			growFactor: {
				min: 0.1,
				max: 1
			},
			bloomRadius: {
				min: 8,
				max: 10
			},
			density: 10,
			growSpeed: 1000 / 60,
			color: {
				rmin: 128,
				rmax: 255,
				gmin: 0,
				gmax: 128,
				bmin: 0,
				bmax: 128,
				opacity: 0.1
			},
			tanAngle: 60
		};
		Garden.random = function (min, max) {
			return Math.random() * (max - min) + min;
		};
		Garden.randomInt = function (min, max) {
			return Math.floor(Math.random() * (max - min + 1)) + min;
		};
		Garden.circle = 2 * Math.PI;
		Garden.degrad = function (angle) {
			return Garden.circle / 360 * angle;
		};
		Garden.raddeg = function (angle) {
			return angle / Garden.circle * 360;
		};
		Garden.rgba = function (r, g, b, a) {
			return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
		};
		Garden.randomrgba = function (rmin, rmax, gmin, gmax, bmin, bmax, a) {
			var r = Math.round(Garden.random(rmin, rmax));
			var g = Math.round(Garden.random(gmin, gmax));
			var b = Math.round(Garden.random(bmin, bmax));
			var limit = 5;
			if (Math.abs(r - g) <= limit && Math.abs(g - b) <= limit && Math.abs(b - r) <= limit) {
				return Garden.rgba(rmin, rmax, gmin, gmax, bmin, bmax, a);
			} else {
				return Garden.rgba(r, g, b, a);
			}
		};