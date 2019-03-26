/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *
 * ==========================================================================*/

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    console.log("Drag");
    ev.dataTransfer.setData("id", ev.target.id);
    ev.dataTransfer.setData("title", ev.target.name);
    console.log(ev.target.id);
    console.log(ev.target.name);
}

function drop(ev) {
    console.log("Drop");
    ev.preventDefault();
    var id = ev.dataTransfer.getData("id");
    //ev.target.appendChild(document.getElementById(data));
    var title = ev.dataTransfer.getData("title");
    console.log(id);
    console.log(title);
}

////////////////////////////////////////////////////////////////////////////
// Put a text on the window with location info for where you clicked
function onMapClick(e) {
    $("#DebugWindow").append("[" + e.latlng.lat + "," + e.latlng.lng + "],<br/>");
}
