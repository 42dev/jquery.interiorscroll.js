/*
	File: jQuery.interiorScroll.1.0.js 
	
	Ross Harrison, Paul Klopping, 2011
	
	Requirements: The plugin includes these files jquery.mousewheel.js, jquery-ui-1.8.16.draggable.mil.js, jquery.preloadit.js
	
	Class: jquery.interiorScroll 
		This plugin allows elements to be scrollable, without using the built in browser scroll bars.
	
	Group: Public 
*/
(function($) {
	//public functions
	var methods = {
		/*
			Function: init
			This function sets the up plugin: adds evenlisteners and extra html elements

			Parameters:
				minHandleSize - Minimum boundary for handle size. Handle Size will adjust based on how much of the scrolling div is visible.
				isVertical - If set to true the div will scroll vertically. If false it will scroll horizontally.
				marginAuto - If set to true and the comtaining div grows larger than the content the left and right margins will be set to auto (for hoz center)
		*/
		
		init : function(options) {
			var defaults = {
				minHandleSize: 20,
				isVertical:	true,
				useSlider: true,
				useArrows: false,
				marginAuto:	false
			}, t;			
			$.extend(this, defaults, options);
			
			
			//add internal this vars
			this.$container		= $(this);
			this.$scrollDiv		= this.$container.children();
			this.minTopMargin	= null;
			this.minLeftMargin	= null;
			this.scrollInterval	= 0;
			this.currTopMargin	= 0;
			this.currLeftMargin	= 0;
			this.prevTouchY		= 0;
			this.prevTouchX		= 0;
			this.initialized	= false;
			
			//add arrow place holders
			this.$arrowUp		= null;
			this.$arrowDown		= null;	
			this.$arrowLeft		= null;
			this.$arrowRight	= null;
			
			t = this;
			//there might be images thar in there
			this.$container.preloadit({
				onComplete: function(){
					setUpScroll.apply(t, []);
				}
			});			
			setUpScroll.apply(this, []);			
			
			try{
				this[0].addEventListener("touchstart", function(e){
					onTouchStart.apply(t, [e]);
				}, true);
				this[0].addEventListener("touchmove", function(e){
					onTouchMove.apply(t, [e]);
				}, true);
			}catch(e){}			
			
			var $w = $(window);
			$(window).unbind("scrollResize").bind("scrollResize",function(){
				if (t.isVertical){
					calcMinTopMargin.apply(t, []);
				} else {
					calcMinLeftMargin.apply(t, []);
				}
			}).resize(function(){
				$w.trigger("scrollResize");
			});
			
			return this;
			
		}, 
		/*
			Function: reset
			This function should be called when the contents of the scrolling div have changed.
			It sets the scrolling div to its original position, either top 0 or left 0, and
			recalculates the scrolling distance.
		 */
		reset : function(){
			//make it look like it was never scrolled
			scrollTo.apply(this, [0]);			
			setUpScroll.apply(this);
		},
		/*
		 * Function: scrollTo
		 * This function tells the scroll area to move to a specific location. Calls scrollTo (Private)
		 * 
		 * Parameters:
		 * offset - Location to scroll to 
		 * 
		 * see also: <scrollTo (Private)>
		 */
		scrollTo: function(offset){
			scrollTo.apply(this, [offset]);
		}
	};
	
	/*
		private vars
	*/
	var lineHeight=10;
		
	/*
	 * This function is called on initialization and sets up the scrolling capability
	 */			
	function setUpScroll(){
		var t = this;
		//calculate top/left margin for this div set up
		if (t.isVertical){
			calcMinTopMargin.apply(t, []);
			//if no top margin, wait one hundreth a second and try again
			if(this.minTopMargin===null){
				setTimeout(function(){
					setUpScroll.apply(t, []);
				}, 10);
				return false;
			}
			
			if(t.useArrows){
				if(t.initialized && t.$arrowUp){
					t.$arrowUp.remove();
					t.$arrowDown.remove();
				}
				
				setUpArrows.apply(t);
					
				t.$container
				.before(t.$arrowUp)
				.after(t.$arrowDown);//add arrows before and after
			}
		} else {
			calcMinLeftMargin.apply(t, []);
			//if no left margin, wait one hundreth a second and try again
			if(this.minLeftMargin===null){
				setTimeout(function(){
					setUpScroll.apply(t, []);
				}, 10);
				return false;
			}
			
			if(t.useArrows){
				if(t.initialized && t.$arrowLeft){
					t.$arrowLeft.remove();
					t.$arrowRight.remove();
				}
				
				setUpArrows.apply(t);
					
				t.$container
				.before(t.$arrowLeft)
				.after(t.$arrowRight);//add arrows before and after
			}
		}
		
		if(!t.initialized){
			//bind mouse wheel event. only once
			t.$container.mousewheel(function(event, delta){
				onScroll.apply(t, [delta]);
				event.preventDefault();
			});
		}	
		
		if(t.useSlider){
			//(re)initialize slider	
			if(t.initialized && t.$slider){
				t.$slider.remove();
				t.$handle.remove();
			}
			setUpSlider.apply(t);	
		}
		
		
		t.initialized = true;	
	}
	
	/*
	 * Group: arrow handling
	 * 
	 * Function: setUpArrows
	 *	creates arrows, and binds them to functions
	 */
	function setUpArrows(){
		var t = this;
		if (t.isVertical){
		//Arrow Up Stuff
			t.$arrowUp = $(document.createElement("a"));
			t.$arrowUp.attr("class", "scrollArea top")
				.html($(document.createElement("div")).attr("class", "arrowUp"));
			t.$arrowUp.attr("href", "#scroll");
				
			t.$arrowUp
			//arrow up mouse binding each line is just calling another function, adjusting the this var
				.mouseup(function(){stopScroll.apply(t, []);})
				.mousedown(function(){scrollUp.apply(t,[]);})
				.hover(function(){scrollUp.apply(t, []);}, function(){stopScroll.apply(t, []);})
				.click(function(e){return false;});
			
		//Arrow Down Stuff
			t.$arrowDown = $(document.createElement("a"));
			t.$arrowDown.attr("class", "scrollArea bottom").html($(document.createElement("div")).attr("class", "arrowDown"));
			t.$arrowDown.attr("href", "#scroll");
			
			//arrow down mouse binding each line is just calling another function, adjusting the this var
			t.$arrowDown
				.mouseup(function(){stopScroll.apply(t, []);})
				.mousedown(function(){scrollDown.apply(t, []);})
				.hover(function(){
					scrollDown.apply(t, []);
				}, function(){
					stopScroll.apply(t, []);
				})
				.click(function(e){return false;});			
	
			if(this.minTopMargin > 0){
				t.$arrowDown.css("opacity", 0);
				t.$arrowUp.css("opacity", 0);
			}
		} else { //Not vertical, set up horizontal scrollz
		//Arrow Left Stuff
			t.$arrowLeft = $(document.createElement("a"));
			t.$arrowLeft.attr("class", "scrollArea left")
				.html($(document.createElement("div")).attr("class", "arrowLeft"));
			t.$arrowLeft.attr("href", "#scroll");
				
			t.$arrowLeft
			//arrow up mouse binding each line is just calling another function, adjusting the this var
				.mouseup(function(){stopScroll.apply(t, []);})
				.mousedown(function(){scrollLeft.apply(t,[]);})
				.hover(function(){
						scrollLeft.apply(t, []);
				}, function(){
					stopScroll.apply(t, []);
				})
				.click(function(e){
						return false;
				});
			//hide
			
		//Arrow Right Stuff
			t.$arrowRight = $(document.createElement("a"));
			t.$arrowRight.attr("class", "scrollArea right").html($(document.createElement("div")).attr("class", "arrowRight"));
			t.$arrowRight.attr("href", "#scroll");
			
			//arrow down mouse binding each line is just calling another function, adjusting the this var
			t.$arrowRight
				.mouseup(function(){stopScroll.apply(t, []);})
				.mousedown(function(){scrollRight.apply(t, []);})
				.hover(function(){scrollRight.apply(t, []);}, function(){stopScroll.apply(t, []);})
				.click(function(e){return false;});			
	
			if(this.minLeftMargin > 0){
				t.$arrowLeft.css("opacity", 0);
				t.$arrowRight.css("opacity", 0);
			}
		}
	}

	/*
	 * Group: Slider Handling
	 * 
	 * Function: setUpSlider (Private)
	 * 
	 * This function creates and configures the sliding bar on the right hand or bottom of the scrolling div.
	 * The Sliding bar is draggable, repositions after scroll, and sizes based on the percentage of scrolling content visible.
	 */
	function setUpSlider(){
		var t = this, visiblePercentage;
		if (t.isVertical){
			if(t.minTopMargin >=0){
				return;
			}
		} else { //not vertical, do hoz scrollz stuff
			if(t.minLeftMargin >=0){
				return;
			}
		}
		
		//create slider divs and add to dom
		t.$slider = $(document.createElement("div")).addClass("slider");
		t.$handle = $(document.createElement("div")).addClass("sliderHandle");
		t.$slider.append(t.$handle);
		t.$container.after(t.$slider);
		
		//get dimensions for slider
		if (t.isVertical){
			visiblePercentage = t.$container.height()/t.$scrollDiv.height();
			t.sliderHeight	= t.$slider.height();
			t.handleHeight	= Math.round(t.sliderHeight*visiblePercentage);
			t.handleHeight	= (t.handleHeight < t.minHandleSize)?t.minHandleSize:t.handleHeight;
			
			//set dimensions and configure drag
			t.$handle.height(t.handleHeight).draggable({
				containment: "parent", //contained by parent
				axis:"y", //only y scroll for now
				drag: function(){
					var currTop = (t.$handle.position()).top,
					percentage = currTop/t.maxHandleTop; 
					
					scrollTo.apply(t, [percentage*t.minTopMargin]);								
				}			
			});
			//allow for !important heights
			t.handleHeight = t.$handle.height();
			t.maxHandleTop	= t.sliderHeight - t.handleHeight;

		} else { //not vertical, do hoz scroll stuff
			visiblePercentage = t.$container.width()/t.$scrollDiv.width();
			t.sliderWidth	= t.$slider.width();
			t.handleWidth	= Math.round(t.sliderWidth*visiblePercentage);
			t.handleHeight	= (t.handleWidth < t.minHandleSize)?t.minHandleSize:t.handleWidth;
			t.maxHandleLeft	= t.sliderWidth - t.handleWidth;
		
			//set dimensions and configure drag
			t.$handle.width(t.handleWidth).draggable({
				containment: "parent", //contained by parent
				axis:"x", //only y scroll for now
				drag: function(){
					var currLeft = (t.$handle.position()).left,
					percentage = currLeft/t.maxHandleLeft; 
					
					scrollTo.apply(t, [percentage*t.minLeftMargin]);								
				}			
			});
			//allow for !important widths
			t.handleWidth = t.$handle.width();
		}
	}
	
	/*
	 * Function: setSliderPosition (Private)
	 * 
	 * Sets the position of slider based on the content divs size and position
	 */
	function setSliderPosition(){
		var t = this,
		percentage;
		
		if (t.$handle != undefined){
		
			if (t.isVertical){		
				percentage = t.currTopMargin/t.minTopMargin;
				t.$handle.css({top: t.maxHandleTop*percentage});
			}else{
				percentage = t.currLeftMargin/t.minLeftMargin;
				t.$handle.css({left: t.maxHandleLeft*percentage});	
			}
			
		}
	}
	
	
	/*
	 * Group: Boundary Calculation
	 * 
	 * Function: calcMinTopMargin (Private)
	 * 
	 * Determines vertical boundary for scroll
	 */	
	function calcMinTopMargin(){
		var t = this,
		scrollDivHeight = t.$scrollDiv.outerHeight();
		
		t.minTopMargin = t.$container.height() - scrollDivHeight;
		
		if(scrollDivHeight <= 0 || t.minTopMargin === undefined){			
			setTimeout(function(){
				calcMinTopMargin.apply(t, []);
			}, 10);
			return;
		}
			
	}
	
	/*  
	 * Function: calcMinLeftMargin (Private)
	 * 
	 * Determines horizontal boundary for scroll
	 */	
		
	function calcMinLeftMargin(){
		var t = this,
		scrollDivWidth = t.$scrollDiv.outerWidth();
		
		t.minLeftMargin = t.$container.width() - scrollDivWidth;
		
		if(scrollDivWidth <= 0 || t.minLeftMargin === undefined){			
			setTimeout(function(){
				calcMinLeftMargin.apply(t, []);
			}, 10);
			return;
		}
				
	}	

	/*
	 * Group: Scrolling
	 * 
	 * Function: scrollTo (Private)
	 *	Scrolls to an offset from the zero position.	
	 * 
	 * parameters:
	 *	offset - position to scroll to
	 */	
	function scrollTo(offset){
		var t = this;
		if (t.isVertical){
			if(this.minTopMargin > 0 && offset !== 0){		
				return;
			}	
	        this.currTopMargin = offset;
	        this.$scrollDiv.css("margin-top", this.currTopMargin);
	    } else { //not vertical, do hoz stuff
			if(this.minLeftMargin > 0 && offset !== 0){		
				return;
			}	
	        this.currLeftMargin = offset;
	        if (this.currLeftMargin=="0" && this.marginAuto){
		        //If the content is smaller than the wrapper and the marginAuto option is set, set margins to Auto
				this.$scrollDiv.css('margin-left', 'auto').css('margin-right', 'auto');
			} else {
				this.$scrollDiv.css('margin-left', this.currLeftMargin);
		    }
	    }
		setSliderPosition.apply(this);
    }
		
	/*
	 * Function: onScroll (private)
	 * 
	 * Listener for the mouseScroll jquery plugin. Takes in a delta value and updates the scroll position incrementally
	 */
	function onScroll(delta) {
		var t = this;
		
		if (t.isVertical){
			//no where to go
			if(t.minTopMargin > 0){	
				return;
			}	
			//don't go to far up
			if(delta > 0 && t.currTopMargin >= 0){
				return;
			}
			//or to far down
			if(delta < 0 && t.currTopMargin <= this.minTopMargin){
				return;
			}
			
	        t.currTopMargin += delta*lineHeight;
	        t.currTopMargin = (t.currTopMargin > 0)?0:t.currTopMargin;
	        t.currTopMargin = (t.currTopMargin < t.minTopMargin)?t.minTopMargin:t.currTopMargin;
	        
	        t.$scrollDiv.css("margin-top", t.currTopMargin);
		} else { //not vertical, do hoz stuff
			//no where to go
			if(t.minLeftMargin > 0){	
				return;
			}	
			//don't go to far up
			if(delta > 0 && t.currLeftMargin >= 0){
				return;
			}
			//or to far down
			if(delta < 0 && t.currLeftMargin <= t.minLeftMargin){
				return;
			}
			
	        t.currLeftMargin += delta*lineHeight;
	        t.currLeftMargin = (t.currLeftMargin > 0)?0:t.currLeftMargin;
	        t.currLeftMargin = (t.currLeftMargin < t.minLeftMargin)?this.minLeftMargin:this.currLeftMargin;
	        
			if (this.currLeftMargin=="0" && this.marginAuto){
		        //If the content is smaller than the wrapper and the marginAuto option is set, set margins to Auto
				t.$scrollDiv.css('margin-left', 'auto').css('margin-right', 'auto');
			} else {
				t.$scrollDiv.css('margin-left', t.currLeftMargin);
			}
			
		}

        //show changes on slider
        setSliderPosition.apply(t);            
	}
	
	/*
	 * Group: arrows Listeners
	 * 
	 * Function: scrollUp
	 *	scrolls div up on interval
	 */
	function scrollUp(){
		var t = this;
		clearInterval(t.scrollInterval);
		t.scrollInterval = setInterval(function(){
			onScroll.apply(t, [0.5]);
		}, 16);				
	}
	/*
	 * Function: scrollDown
	 *	scrolls div down on interval 
	 */
	function scrollDown(){
		var t = this;
		clearInterval(t.scrollInterval);
		t.scrollInterval = setInterval(function(){			
			onScroll.apply(t, [-0.5]);
		}, 16);
	}
	/*
	 * Function: scrollRight
	 *	scrolls div Left on interval 
	 */
	function scrollLeft(){
		var t = this;
		clearInterval(t.scrollInterval);
		t.scrollInterval = setInterval(function(){
			onScroll.apply(t, [0.5]);
		}, 16);				
	}/*
	 * Function: scrollRight
	 *	scrolls div right on interval 
	 */
	function scrollRight(){
		var t = this;
		clearInterval(t.scrollInterval);
		t.scrollInterval = setInterval(function(){			
			onScroll.apply(t, [-0.5]);
		}, 16);
	}/*
	 * Function: stopScroll
	 *	stops scrolling interval 
	 */
	function stopScroll(){
		clearInterval(this.scrollInterval);
		return false;
	}
	
	/*
	 * Group: Touch Events
	 * 
	 * These events translate touch screen events into scrolling action through the onScroll listener
	 * 
	 * Function: onTouchStart
	 * 
	 * Logs the initial touch on the screen for later comparison
	 */
	function onTouchStart(event){	
		var touches = event.changedTouches;
		
		if(touches.length !== 1){
			return;
		}
		var first = touches[0];
		this.prevTouchY = first.pageY;
		this.prevTouchX = first.pageX;		
	}	
	
	/*
	 * Function: onTouchMove
	 * 
	 * Determines change in touch position and translates into a onScroll call to update the scroll position. 
	 */
	function onTouchMove(event){
		var touches = event.changedTouches;
		
		if(touches.length !== 1){
			return;
		}

		var first = touches[0];
		
		if (this.isVertical){
			onScroll.apply(this, [(first.pageY-this.prevTouchY)/lineHeight, this.$scrollDiv]);
			this.prevTouchY = first.pageY;
		} else { //not vertical, do hoz stuff
			onScroll.apply(this, [(first.pageX-this.prevTouchX)/lineHeight, this.$scrollDiv]);
			this.prevTouchX = first.pageX;
		}
		
		event.preventDefault();		
	}
	
	$.fn.interiorScroll = function(method) {
		//Method Calling Login
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('Method ' + method + ' does not exist on jQuery.');
		}
	};
}(jQuery));