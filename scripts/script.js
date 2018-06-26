// Description:
//  BART Train Times Slackbot. 
//  Slackbot to provide real-time train arrival times for user specified BART stations 
//
// Dependencies:
//   BART API - http://api.bart.gov/
//
// Configuration:
//   None
//
// Commands:
//  bart help (shows usage instructions)
//  bart map (show BART map of lines and stations)
//  bart codes (shows 4 letter station codes and their correspoding BART stations)
//  bart arrivals <station 4 letter code> (e.g. 'bart arrivals mont' for all arriving trains for all lines at Montgomery BART station)
//  bart next <station 4 letter code> (e.g. 'bart next mont' for the next train for each line arriving at Montgomery BART station)
//
// Author: Rubeun Tan
// Date: June 25th 2018

module.exports = function(robot) {

  // BART HELP - gives usage instructions
  robot.hear(/bart help/i, function(msg){
    let helpInfo = `\nUsage:\n
    bart map -> Show a map of BART stations & lines\n
    bart codes -> Show a full list of the 4 letter BART station codes\n
    bart arrivals <station code> - > List all arriving trains to BART station corresponding to <station code> (e.g. bart arrivals mont)\n
    bart next <station code> -> List only the next train from each line (e.g. bart next mont)\n`;
    msg.send(helpInfo);
  });

  // BART MAP - displays map of BART stations and lines
  robot.hear(/bart map/i, function(msg){
    let bartMap = "https://www.bart.gov/sites/all/themes/bart_desktop/img/system-map.gif";
    return msg.send(bartMap);
  });

  // BART CODES - lists all 4 letter station codes needed to display arrival times of specific stations
  robot.hear(/bart codes|code/i, function(msg){
    let stationCodes = `\nList of 4 letter station codes to their corresponding BART station:\n
      12th	12th St. Oakland City Center\n
      16th	16th St. Mission (SF)\n
      19th	19th St. Oakland\n
      24th	24th St. Mission (SF)\n
      ashb	Ashby (Berkeley)\n
      antc	Antioch\n
      balb	Balboa Park (SF)\n
      bayf	Bay Fair (San Leandro)\n
      cast	Castro Valley\n
      civc	Civic Center (SF)\n
      cols	Coliseum\n
      colm	Colma\n
      conc	Concord\n
      daly	Daly City\n
      dbrk	Downtown Berkeley\n
      dubl	Dublin/Pleasanton\n
      deln	El Cerrito del Norte\n
      plza	El Cerrito Plaza\n
      embr	Embarcadero (SF)\n
      frmt	Fremont\n
      ftvl	Fruitvale (Oakland)\n
      glen	Glen Park (SF)\n
      hayw	Hayward\n
      lafy	Lafayette\n
      lake	Lake Merritt (Oakland)\n
      mcar	MacArthur (Oakland)\n
      mlbr	Millbrae\n
      mont	Montgomery St. (SF)\n
      nbrk	North Berkeley\n
      ncon	North Concord/Martinez\n
      oakl	Oakland International Airport\n
      orin	Orinda\n
      pitt	Pittsburg/Bay Point\n
      pctr	Pittsburg Center\n
      phil	Pleasant Hill\n
      powl	Powell St. (SF)\n
      rich	Richmond\n
      rock	Rockridge (Oakland)\n
      sbrn	San Bruno\n
      sfia	San Francisco International Airport\n
      sanl	San Leandro\n
      shay	South Hayward\n
      ssan	South San Francisco\n
      ucty	Union City\n
      warm	Warm Springs/South Fremont\n
      wcrk	Walnut Creek\n
      wdub	West Dublin\n
      woak	West Oakland\n`;
    return msg.send(stationCodes);
  });

  // BART ARRIVALS/NEXT - gets all arriving trains corresponding to the 4 letter station code of a specific BART station
  robot.hear(/bart (.*) (.*)/i, function(msg) {
    let command = escape(msg.match[1]);
    // ONLY proceed if command is either arrivals or next, else exit
    if ((command === "arrivals") | (command === "next")) {
      let stationCode = escape(msg.match[2]);
      let bartAPI = "http://api.bart.gov/api/etd.aspx?cmd=etd&orig=" + stationCode + "&key=MW9S-E7SL-26DU-VV8V&json=y";

      // call BART API
      return msg.http(bartAPI).get()(function(err, res, body){
        let error, json;
        try {
          let stationName, trainDirection = "", nextTrains = "";
          json = JSON.parse(body);
          stationName = json.root.station[0].name;
          
          // Get all arriving trains from all lines
          if (command === "arrivals") {
            json.root.station[0].etd.forEach(function(train){
              if (train.estimate[0].direction === "North") {
                trainDirection = "Northbound";
              } else {
                trainDirection = "Southbound";
              }
              nextTrains += trainDirection + " " + train.estimate[0].color.toLowerCase() + " Line: *" + train.destination + "* in ";
              train.estimate.forEach(function(times){
                nextTrains += times.minutes + " minutes(" + times.length + " cars) ";
              });
              nextTrains += "\n"
            });
          // Get only the next train for all lines  
          } else {
            json.root.station[0].etd.forEach(function(train){
              if (train.estimate[0].direction === "North") {
                trainDirection = "Northbound";
              } else {
                trainDirection = "Southbound";
              }
              nextTrains += trainDirection + " " + train.estimate[0].color.toLowerCase() + " Line: *" + train.destination + "* in " + train.estimate[0].minutes + " minutes(" + train.estimate[0].length + " cars)\n";
              
            });    
          }
          // output all information. #youredone
          return msg.send("\nBART Station: *" + stationName + "*\n" + "Next arriving trains as of " + json.root.time + ":\n```" + nextTrains + "```");
 
        // Error Handling
        } catch(_error) {
          error = _error;
          return msg.send("Invalid Station Code \'" + stationCode + "\'. Please check that you have the correct 4 letter station code with \'bart codes\' (unless you prefer to :running:)\n");
          //return msg.send("ErrorMsg: " + error);
        }
      });
    // ignore if invalid command (not arrivals or next). 
    } else {
      return;
    };


  });      

}