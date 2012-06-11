function new_game() {

    APPLESFIRST.evil_bot.initalize_stolen_fruit();
}

function make_move() {
//The starting strategy is to win one fruit category as fast as possible while ignoring what the opponent 
//does at first, and rethink the itinerary whenever the opponent bot removes a fruit from the board.

    if ((APPLESFIRST.mybot.best_itinerary.length <= 1) || APPLESFIRST.evil_bot.stole_a_fruit()){
    //when do I have to rethink my itinerary
	APPLESFIRST.boardmaster.board = get_board();
	APPLESFIRST.boardmaster.find_the_fruit();
	APPLESFIRST.boardmaster.research_fruits_to_win();
	APPLESFIRST.mybot.find_best_itinerary();
	
    };    

    if (APPLESFIRST.boardmaster.is_the_game_over() || APPLESFIRST.mybot.best_itinerary.length<2){
	return PASS;
    }
    else{
        var westeast = APPLESFIRST.mybot.best_itinerary[1].x - get_my_x();
        var northsouth = APPLESFIRST.mybot.best_itinerary[1].y - get_my_y();
    
        if (westeast > 0){
	   return EAST;
        }
        else if (westeast < 0){
	   return WEST;
        }
        else{
            if (northsouth < 0){
        	return NORTH;
            }
            else if (northsouth > 0){
        	return SOUTH;
            }
	    else{
		//found the next stop, pick up fruit
		APPLESFIRST.mybot.best_itinerary.splice(1,1);
        	return TAKE;
	    };
        };
    };
}


var APPLESFIRST = {

    mybot:{
    //will decide where to go

	Position: function (my_x,my_y){
	    this.x = my_x;
	    this.y = my_y;
	},

	best_itinerary:[],
	best_cost: 0 ,

	is_member_of: function (fruit,itinerary){
	    for(var stop=0;stop<itinerary.length;stop+=1){
		if (fruit === itinerary[stop]){
		    return true;
		};
	    };
	    return false;
	},

	overwrite_itinerary:function (copy_to,source){
	    copy_to.splice(0,copy_to.length);
	    for (var stop = 0; stop < source.length; stop +=1){
		copy_to.push(source[stop]);
	    };
	},

	find_best_itinerary: function (current_itinerary,current_cost){
	    var my_position = new this.Position(get_my_x(),get_my_y());
	    var current_itinerary= new Array(0);
	    current_itinerary.push(my_position);
	    var current_cost = 0; 
	    this.best_cost= HEIGHT*WIDTH*HEIGHT*WIDTH; //start with maximum possible cost
	    for(var type=1;type<get_number_of_item_types()+1;type+=1){  
		//concentrate on one kind of fruit    
		this.max_move(current_itinerary,current_cost,type);
	    };
	},
	
	max_move: function(current_itinerary,current_cost,type){
	//generate itineraries covering only one type of fruit and pick the one which will give you a win
	//fastest for any type of fruit
        for (var cfruit=0;cfruit<APPLESFIRST.boardmaster.fruits[type].length;cfruit+=1){
            if ((!this.is_member_of(APPLESFIRST.boardmaster.fruits[type][cfruit],current_itinerary))
	    &&
	    APPLESFIRST.boardmaster.how_many_fruits_to_win[type]<=APPLESFIRST.boardmaster.fruits[type].length 
	    &&
            APPLESFIRST.boardmaster.how_many_fruits_to_win[type]>0){
            //not going to any fruit twice AND
            //there are enough fruits of that type on the board to win 
        	current_itinerary.push(APPLESFIRST.boardmaster.fruits[type][cfruit]);
    
        	var current_leg_cost = APPLESFIRST.boardmaster.calculate_travel_cost
        				(current_itinerary[current_itinerary.length-1],
        				 current_itinerary[current_itinerary.length-2]);
        	current_cost += current_leg_cost + 1;
        	//+1 for pick up cost
    
        	if (this.best_cost > current_cost){
        	//prune if travel cost gets too expensive
        	    if(current_itinerary.length > APPLESFIRST.boardmaster.how_many_fruits_to_win[type]){
        	    //does the itinerary have enough fruit to win?
        		this.overwrite_itinerary(this.best_itinerary,current_itinerary);
        		this.best_cost = current_cost;
        	    }
        	    else{
        		this.max_move(current_itinerary,current_cost,type);
        	    };
        	};
        	current_itinerary.pop();
        	current_cost -= (current_leg_cost + 1);
            };
    	};
	},
    },

    evil_bot:{
	stolen_fruit:[],
	initalize_stolen_fruit:function(){
	    for(var type=1; type<get_number_of_item_types()+1; type+=1){
		this.stolen_fruit[type]=0;
	    };
	},
	stole_a_fruit: function (){
	    var current_stolen_fruit = new Array(get_number_of_item_types()+1);
	    for(var type=1; type<get_number_of_item_types()+1; type+=1){
		current_stolen_fruit[type] = get_opponent_item_count(type);
		if (current_stolen_fruit[type] > this.stolen_fruit[type]){
		    this.stolen_fruit[type] = current_stolen_fruit[type];
		    return true;
		};
	    };
	    return false;

	}
    },

    boardmaster:{
	// the boardmaster knows all about the fruit, where they hide, how many you need
	// and what it will cost you to get them
	board: [],
	Fruit: function (at_x,at_y)	{
	    this.x = at_x; 
	    this.y = at_y;
	},
	fruits: [],
	how_many_fruits_to_win: [],

	create_fruits_array: function (){
	    var fruits_array = new Array(get_number_of_item_types()+1);
	    for (var type=1; type<get_number_of_item_types()+1;type+=1){
		fruits_array[type]= new Array(0); 	  
	    };
	    return fruits_array;
	},

	find_the_fruit: function () { 
	    this.fruits=this.create_fruits_array();
	    for(var i=0; i<WIDTH; i+=1) {
		for(var j=0; j<HEIGHT; j+=1){
		    if (has_item(this.board[i][j])){
			var type = this.board[i][j];
			this.fruits[type].push(new this.Fruit(i,j));
		    }; 
		};
	    };
	},
	
	research_fruits_to_win: function (){
	    //what's the minimum number of fruit of each category I need for winning 
	    for(var type=1; type<get_number_of_item_types()+1; type+=1){
		//fruittypes start with 1
		this.how_many_fruits_to_win[type]=Math.ceil
		    (Math.ceil((get_total_item_count(type)+0.3)/2)-get_my_item_count(type));
		//0.3 random float in between 0.0 and 0.5 
		//outer round up to account for the half fruit that got destroyed
	    };
	},
	
	calculate_travel_cost: function(start,end){
	    var cost = Math.abs(start.x-end.x) + Math.abs(start.y-end.y);
	    return cost;
	},
	
	is_the_game_over: function (){
	    var game_over = 1;
	    for(var type=1; type<get_number_of_item_types()+1; type+=1){
		if (get_my_item_count(type)+get_opponent_item_count(type)<get_total_item_count(type)){

		    game_over = 0;
		};
	    };
	    return game_over;
	}
	
    }

}
