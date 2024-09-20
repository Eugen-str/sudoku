let sudoku_grid = [];
let sudoku_grid_set = [];
let color_grid = [];

let selected = [];
let selected_pad = 0;
let color = "white";

const default_mode = 0;
const solve_mode = 1;
const create_mode = 2;

let mode = default_mode;

const rule_normal = 0;
const rule_normal_text = "Normal Sudoku: the digits 1-9 must be placed in each row, column and 3x3 box without repeating"
const rule_killer = 1;
const rule_killer_text = "Killer Sudoku: the sum of the digits within each marked cage is in the top-left corner of the cage";
const rule_left_diagonal = 2;
const rule_left_diagonal_text = "Rising diagonal: numbers on the increasing (positive) diagonal can not repeat";
const rule_right_diagonal = 3;
const rule_right_diagonal_text = "Rising diagonal: numbers on the decreasing (negative) diagonal can not repeat";
const rule_kropki_white = 4;
const rule_kropki_white_text = "White Kropki dots: cells seperated by a white dot must have consecutive digits";
const rule_kropki_black = 4;
const rule_kropki_black_text = "Black Kropki dots: the digits in cells seperated by a black dot must be in a 2:1 ratio";
let ruleset = [];

let cell_len = Math.floor((window.innerHeight - 300) / 9);

const url_params = new URLSearchParams(window.location.search);

function change_color_mode(){
    if(color == "white"){
        for(elem of document.body.getElementsByTagName("*")){
            elem.classList.remove("dark-mode");
        }
        document.body.classList.remove("dark-mode");
    }
    else if(color == "black"){
        for(elem of document.body.getElementsByTagName("*")){
            elem.classList.add("dark-mode");
        }
        document.body.classList.add("dark-mode");
    }
    localStorage["dark_mode"] = JSON.stringify(color);
}

function unset_selected(){
    if(selected.length != 0){
        document.getElementById("sudoku_div")
            .querySelectorAll(`[xpos="${selected[0]}"][ypos="${selected[1]}"]`)[0]
            .classList.remove("selected");
    }
    selected = [];
}

function set_selected(x, y){
    selected.push([x, y]);

    if(selected.length == 1){
        for(let cell_div of document.getElementById("sudoku_div")
            .querySelectorAll(`[xpos][ypos]`))
            cell_div.classList.remove("selected");
    }

    document.getElementById("sudoku_div")
        .querySelectorAll(`[xpos="${x}"][ypos="${y}"]`)[0]
        .classList.add("selected");
}

function unselect_selected(){
    for(let sel_cel of selected){
        let [x, y] = sel_cel;
        document.getElementById("sudoku_div")
            .querySelectorAll(`[xpos="${x}"][ypos="${y}"]`)[0]
            .classList.remove("selected");
    }
}

function update_selected(num){
    if(selected.length == 0){
        return;
    }
    for(let sel_cel of selected){
        let [x, y] = sel_cel;
        if(sudoku_grid_set[y][x] != -1){
            continue;
        }

        sudoku_grid[y][x] = num;

        document.getElementById("sudoku_div")
            .querySelectorAll(`[xpos="${x}"][ypos="${y}"]`)[0]
            .innerHTML = `${num}`;
    }
}

function update_selected_color(col){
    console.log('a');
    if(selected.length == 0){
        return;
    }
    for(let sel_cel of selected){
        let [x, y] = sel_cel;

        color_grid[y][x] = col;

        document.getElementById("sudoku_div")
            .querySelectorAll(`[xpos="${x}"][ypos="${y}"]`)[0]
            .style.backgroundColor = col;
    }
}

function init_grid(){
    sudoku_grid = [];
    for(let i = 0; i < 9; i++){
        let arr = [];
        for(let j = 0; j < 9; j++){
            arr.push(-1);
        }
        sudoku_grid.push(arr);
    }
}

function reset_grid(){
    sudoku_grid = [];
    for(let i = 0; i < 9; i++){
        let arr = [];
        for(let j = 0; j < 9; j++){
            arr.push(sudoku_grid_set[i][j]);
        }
        sudoku_grid.push(arr);
    }
}

function init_grid_set(){
    sudoku_grid_set = [];
    for(let i = 0; i < 9; i++){
        let arr = [];
        for(let j = 0; j < 9; j++){
            arr.push(-1);
        }
        sudoku_grid_set.push(arr);
    }
}

function show_sudoku(){
    let container = document.getElementById("sudoku_div");

    container.innerHTML = "";

    let content = "";

    for(let i = 0; i < 9; i++){
        content += `<div class="row">`;

        for(let j = 0; j < 9; j++){
            let text = "";

            if(sudoku_grid[i][j] != -1){
                text = `${sudoku_grid[i][j]}`;
            }

            let vert_border = "";
            let hor_border = "";
            if(j == 0){
                vert_border = "vert_sep_left";
            }
            if(j % 3 == 2){
                vert_border = "vert_sep_right";
            }
            if(i == 8){
                hor_border = "hor_sep_bottom";
            }
            if(i % 3 == 0){
                hor_border = "hor_sep_top";
            }

            let current_color = color_grid[i][j];
            content +=
                `<div class="cell ${vert_border} ${hor_border}" style="background-color:${current_color}; height:${cell_len}px; width:${cell_len}px;" xpos="${j}" ypos="${i}">${text}</div>`;
        }

        content += `</div>`;
    }

    container.innerHTML = content;
    change_color_mode();
    show_set_cells();

    let rs_height = window.innerHeight - document.getElementById("nav-bar").offsetHeight - 20;
    for(rs of document.getElementsByClassName("right-side")){
        rs.style.height = `${rs_height}px`;
    }
}

function show_set_cells(){
    let rows = document.getElementById("sudoku_div").childNodes;
    let curr_row = 0;
    for(let row of rows){
        let curr_col = 0;
        for(let cell of row.childNodes){
            if(sudoku_grid_set[curr_row][curr_col] != -1){
                cell.style.color = "black";
            }
            curr_col++;
        }
        curr_row++;
    }
}

function show_pad_buttons(){
    let create_tools = "";
    if(mode == create_mode){
        create_tools = `
            <div id="btn-pad-create" class="cell nums"
                 style="font-size:20px; height:${cell_len/2}px; width:${cell_len}px;">SET</div>
            `;
    }
    let content = `
        <div class="row">
            <div id="btn-pad-num" class="cell nums"
                 style="font-size:20px; height:${cell_len/2}px; width:${cell_len}px;">NUM</div>
            <div id="btn-pad-col" class="cell nums"
                 style="font-size:20px; height:${cell_len/2}px; width:${cell_len}px;">COL</div>
            ${create_tools}
        </div>
    `;

    document.getElementById("buttons-pad").innerHTML = content;
}

function show_num_buttons(){
    let content = "";

    let style = `style="height:${cell_len}px; width:${cell_len}px;"`

    for(let i = 0; i < 9; i++){
        if(i % 3 == 0){
            if(i != 0){
                content += "</div>";
            }
            content += `<div class="row">`;
        }

        content += `<div class="cell nums" ${style} value="${i+1}">${i+1}</div>`;
    }

    content += `<div class="cell nums" ${style} value="delete">C</div>`;

    content += "</div>";

    document.getElementById("selected-pad").innerHTML = content;
}

function popup(elem){
    let button_close = `
        <div class="btn-popup">
            
        </div>
    `;
    let over = document.createElement("div");
    over.setAttribute("id", "popup-div");
    over.innerHTML = elem;
    document.body.appendChild(over);
}

function set_name(){
    let content = `
        <div class="overlay">
            <h1>test</h1>
        </div>
        `;
    popup(content);
}

function show_create_tools(){
    console.log('test')
    let content = "";

    let style = `font-size:35px; height:${cell_len}px; width:${cell_len*3}px;`

    let texts = ["Set name", "Export", "Import"];
    let funcs = ["set_name", "export_grid", "import_grid"];

    for(let i = 0; i < 9; i++){
        if(i % 3 == 0){
            if(i != 0){
                content += "</div>";
            }
            content += `<div class="row">`;
        }

        content += `<div class="cell nums" style="${style}" onclick="${funcs[i]}()">${texts[i]}</div>`;
    }

    content += "</div>";

    document.getElementById("selected-pad").innerHTML = content;
}


function show_color_buttons(){
    let content = "";

    let style = `height:${cell_len}px; width:${cell_len}px;`

    let colors = ["#999999", "#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7", "white"];

    for(let i = 0; i < 9; i++){
        if(i % 3 == 0){
            if(i != 0){
                content += "</div>";
            }
            content += `<div class="row">`;
        }

        content += `<div class="cell colors" style="${style} background-color:${colors[i]};"></div>`;
    }

    content += "</div>";

    document.getElementById("selected-pad").innerHTML = content;
}

function show_rules(){
    let content = "";

    if(ruleset.length == 0){
        content += rule_normal_text;
    }

    for(let rule of ruleset){
        if(rule == rule_normal){
            content += rule_normal_text;
        } else if(rule == rule_killer){
            content += rule_killer_text;
        } else if(rule == rule_left_diagonal){
            content += rule_left_diagonal_text;
        } else if(rule == rule_right_diagonal){
            content += rule_right_diagonal_text;
        }
    }

    document.getElementById("rules-div").innerHTML = content;
}

function get_colors_from_cache(){
    let local_color_storage = localStorage['dark_mode'];
    if(local_color_storage){
        color = JSON.parse(local_color_storage);
    } else {
        color = "white";
    }
    change_color_mode();
}

function decode_grid(code){
    console
    let grid = [];
    let curr_arr = [];
    let pos = 0;
    for(let i = 0; i < code.length; i += 2){
        let n = code[i];
        let x = code[i+1];
        pos += n;

        for(let j = 0; j < n; j++){
            if(x == 'e'){
                curr_arr.push(-1);
            } else {
                curr_arr.push(parseInt(x));
            }
        }

        if(pos % 9 == 0){
            grid.push(curr_arr);
            curr_arr = [];
        }
    }

    return grid;
}

function encode_grid(){
    let code = "";
    for(let i = 0; i < 9; i++){
        let current_row = "";

        let count = 1;
        let last = sudoku_grid[i][0];
        for(let j = 1; j < 9; j++){
            let current = sudoku_grid[i][j];
            if(current == last){
                count++;
            }
            else{
                let char = "e";
                if(last != -1){
                    char = `${last}`;
                }
                current_row += `${count}${char}`;
                last = current;
                count = 1;
            }
        }
        code += current_row;
    }
    return code;
}

function load_level(code){
    init_grid();
    init_grid_set();

    sudoku_grid_set = decode_grid(code);
    sudoku_grid = structuredClone(sudoku_grid_set);

    show_sudoku();
}

function arrow_key_controls(e){
    if(selected.length == 0){
        return;
    }
    let last = selected[selected.length - 1];
    if(!holding_ctrl){
        selected = [];
    }
    let newx = parseInt(last[0]);
    let newy = parseInt(last[1]);

    if(e.key == "ArrowUp"){
        if(newy != 0){
            newy -= 1;
        }
    }
    if(e.key == "ArrowDown"){
        if(newy != 8){
            newy += 1;
        }
    }
    if(e.key == "ArrowLeft"){
        if(newx != 0){
            newx -= 1;
        }
    }
    if(e.key == "ArrowRight"){
        if(newx != 8){
            newx += 1;
        }
    }
    if(!holding_ctrl){
        unselect_selected();
    }
    if(last[0] != newx || last[1] != newy){
        set_selected(newx.toString(), newy.toString());
    }
}

function backspace(){
    if(remove_selected()) { return; }
    if(remove_selected_colors()) { return; }
}

function remove_selected(){
    let ret = false;
    for(let sel_cel of selected){
        let x = parseInt(sel_cel[0]);
        let y = parseInt(sel_cel[1]);

        if(sudoku_grid_set[y][x] == -1 && sudoku_grid[y][x] != -1){
            ret = true;
            sudoku_grid[y][x] = -1;

            document.getElementById("sudoku_div")
                .querySelectorAll(`[xpos="${x}"][ypos="${y}"]`)[0]
                .innerHTML = '';
        }
    }
    return ret;
}

function remove_selected_colors(){
    let ret = false;
    for(let sel_cel of selected){
        let x = parseInt(sel_cel[0]);
        let y = parseInt(sel_cel[1]);

        if(color_grid[y][x] != "white"){
            color_grid[y][x] = "white";

            document.getElementById("sudoku_div")
                .querySelectorAll(`[xpos="${x}"][ypos="${y}"]`)[0]
                .style.backgroundColor = "white";
        }
    }
    return ret;
}

function write_encoded_board(){
    let code = "test";//encode_board();

    let code_div =
        `<div style="padding-top:5px;">
        <div id="encoded-board" class="row">
            <textarea readonly id="code-ta">${code}</textarea>
            <button onclick="navigator.clipboard.writeText(document.getElementById('code-ta').value)">Copy to clipboard</button>
        </div>
        </div>`;

    if(!document.getElementById("encoded-board")){
        document.getElementsByClassName("left-side")[0].innerHTML += `<div id="encoded-board" class="row">${code_div}</div>`;
    } else {
        document.getElementById("encoded-board").innerHTML = code_div;
    }

    change_color_mode();
}

function init_create_mode(){
    document.title = "Sudoku - Create mode"
    init_grid();
    init_grid_set();
    show_num_buttons("create_tools");
    show_sudoku();
}

function init_play_mode(code){
    document.title = "Sudoku - Solve mode"
    load_level(code);
    show_num_buttons();
    show_sudoku();
}

function init_default_mode(){
    window.location.replace("index.html");
}

function set_mode(){
    let code = url_params.get('code');
    let create = url_params.get('create');
    if(create == ''){
        mode = create_mode;
        init_create_mode();
    } else if(code){
        mode = solve_mode;
        init_play_mode(code);
    } else {
        init_default_mode();
    }
}

let selecting = false;
let holding_ctrl = false;

function init_color_grid(){
    color_grid = [];
    for(let i = 0; i < 9; i++){
        let arr = [];
        for(let j = 0; j < 9; j++){
            arr.push("white");
        }
        color_grid.push(arr);
    }
}

window.onload = function(){
    init_color_grid();
    get_colors_from_cache();
    set_mode();
    show_pad_buttons();
    show_rules();

    document.getElementById("sudoku_div")
            .addEventListener("mousedown", function(e){
                if(!holding_ctrl){
                    unselect_selected();
                    selected = [];
                }
                const target = e.target;
                selecting = true;

                if(target.classList.contains("cell")){
                    let xpos = target.getAttribute("xpos");
                    let ypos = target.getAttribute("ypos");

                    set_selected(xpos, ypos);
                }
    });

    for(let cell_div of document.getElementsByClassName("cell")){
        cell_div.addEventListener("mouseenter", function(e){
            const target = e.target;

            if(selecting){
                let xpos = target.getAttribute("xpos");
                let ypos = target.getAttribute("ypos");

                set_selected(xpos, ypos);
            }
        });
    }


    window.addEventListener("mouseup", function(){
        selecting = false;
    });

    document.getElementById("selected-pad")
            .addEventListener("click", function(e){
                const target = e.target;

                if(selected_pad == 0){
                    if(target.classList.contains("nums")){
                        let num = target.getAttribute("value");
                        if(num == "delete"){
                            remove_selected();
                        } else {
                            update_selected(num);
                        }
                    }
                } else if(selected_pad == 1){
                    if(target.classList.contains("colors")){
                        let num = target.style.backgroundColor;
                        if(num == "delete"){
                            remove_selected();
                        } else {
                            update_selected_color(num);
                        }
                    }
                } else if(selected_pad == 2){
                    // TODO: create tools
                }
            });

    document.getElementById("buttons-pad")
            .addEventListener("click", function(e){
                const target = e.target;

                if(target.id == "btn-pad-num"){
                    show_num_buttons();
                    selected_pad = 0;
                } else if (target.id == "btn-pad-col"){
                    show_color_buttons();
                    selected_pad = 1;
                } else if (target.id == "btn-pad-create"){
                    show_create_tools();
                    selected_pad = 2;
                }
            });


    document.addEventListener("keypress", function(e){
        if(e.key >= '1' && e.key <= '9'){
            update_selected(parseInt(e.key));
        }
    });

    document.addEventListener("keydown", function(e){
        if(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)){
            arrow_key_controls(e);
        }

        if(e.key == "Backspace"){
            backspace();
        }

        if(e.key == "Control"){
            holding_ctrl = true;
        }

        if(e.key == "Escape"){
            unselect_selected();
            selected = [];
        }
    });

    document.addEventListener("keyup", function(e){
        if(e.key == "Control"){
            holding_ctrl = false;
        }
    });

    document.getElementById("btn_clear").addEventListener("click", function(){
        reset_grid();
        show_sudoku();
        selected = [];
    });

    document.getElementById("btn_color_mode").addEventListener("click", function(){
        if(color == "white"){
            color = "black";
        } else {
            color = "white";
        }
        change_color_mode();
    });
}
