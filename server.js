// Muaz Khan      - www.MuazKhan.com
// MIT License    - www.WebRTC-Experiment.com/licence
// Documentation  - github.com/muaz-khan/RTCMultiConnection

function resolveURL(url) {
    var isWin = !!process.platform.match(/^win/);
    if (!isWin) return url;
    return url.replace(/\//g, '\\');
}

// Please use HTTPs on non-localhost domains.
var isUseHTTPs = true;

var port = 8543;
//var port = process.env.PORT || 9005;
var ip_addr = "https://192.168.10.110:8543";
var mysql_addr = '192.168.10.104'
var fs = require('fs');
var path = require('path');

// see how to use a valid certificate:
// https://github.com/muaz-khan/WebRTC-Experiment/issues/62
var options = {
    key: fs.readFileSync(path.join(__dirname, resolveURL('fake-keys/privatekey.pem'))),
    cert: fs.readFileSync(path.join(__dirname, resolveURL('fake-keys/certificate.pem')))
};

// force auto reboot on failures
var autoRebootServerOnFailure = false;


// skip/remove this try-catch block if you're NOT using "config.json"
try {
    var config = require(resolveURL('./config.json'));

    if ((config.port || '').toString() !== '9001') {
        port = parseInt(config.port);
    }

    if ((config.autoRebootServerOnFailure || '').toString() !== true) {
        autoRebootServerOnFailure = true;
    }
} catch (e) { }

// You don't need to change anything below

var server = require(isUseHTTPs ? 'https' : 'http');
var url = require('url');

function serverHandler(request, response) {
    try {
        var uri = url.parse(request.url).pathname,
            filename = path.join(process.cwd(), uri);

        if (filename && filename.search(/server.js|Scalable-Broadcast.js|Signaling-Server.js/g) !== -1) {
            response.writeHead(404, {
                'Content-Type': 'text/plain'
            });
            response.write('404 Not Found: ' + path.join('/', uri) + '\n');
            response.end();
            return;
        }

        var stats;

        try {
            stats = fs.lstatSync(filename);

            if (filename && filename.search(/web/g) === -1 && stats.isDirectory()) {
                response.writeHead(200, {
                    'Content-Type': 'text/html'
                });
                response.write('<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=/web/"></head><body></body></html>');
                response.end();
                return;
            }
        } catch (e) {
            response.writeHead(404, {
                'Content-Type': 'text/plain'
            });
            response.write('404 Not Found: ' + path.join('/', uri) + '\n');
            response.end();
            return;
        }

        if (fs.statSync(filename).isDirectory()) {
            response.writeHead(404, {
                'Content-Type': 'text/html'
            });

            if (filename.indexOf(resolveURL('/web/MultiRTC/')) !== -1) {
                filename = filename.replace(resolveURL('/web/MultiRTC/'), '');
                filename += resolveURL('/web/MultiRTC/index.html');
            } else if (filename.indexOf(resolveURL('/web/')) !== -1) {
                filename = filename.replace(resolveURL('/web/'), '');
                filename += resolveURL('/web/index.html');
            } else {
                filename += resolveURL('/web/index.html');
            }
        }

        var contentType = 'text/plain';
        if (filename.toLowerCase().indexOf('.html') !== -1) {
            contentType = 'text/html';
        }
        if (filename.toLowerCase().indexOf('.css') !== -1) {
            contentType = 'text/css';
        }
        if (filename.toLowerCase().indexOf('.png') !== -1) {
            contentType = 'image/png';
        }

        fs.readFile(filename, 'binary', function (err, file) {
            if (err) {
                response.writeHead(500, {
                    'Content-Type': 'text/plain'
                });
                response.write('404 Not Found: ' + path.join('/', uri) + '\n');
                response.end();
                return;
            }

            try {
                var web = (fs.readdirSync('web') || []);

                if (web.length) {
                    var h2 = '<h2 style="text-align:center;display:block;"><a href="https://www.npmjs.com/package/rtcmulticonnection-v3"><img src="https://img.shields.io/npm/v/rtcmulticonnection-v3.svg"></a><a href="https://www.npmjs.com/package/rtcmulticonnection-v3"><img src="https://img.shields.io/npm/dm/rtcmulticonnection-v3.svg"></a><a href="https://travis-ci.org/muaz-khan/RTCMultiConnection"><img src="https://travis-ci.org/muaz-khan/RTCMultiConnection.png?branch=master"></a></h2>';
                    var otherweb = '<section class="experiment" id="web"><details><summary style="text-align:center;">Check ' + (web.length - 1) + ' other RTCMultiConnection-v3 web</summary>' + h2 + '<ol>';
                    web.forEach(function (f) {
                        if (f && f !== 'index.html' && f.indexOf('.html') !== -1) {
                            otherweb += '<li><a href="/web/' + f + '">' + f + '</a> (<a href="https://github.com/muaz-khan/RTCMultiConnection/tree/master/web/' + f + '">Source</a>)</li>';
                        }
                    });
                    otherweb += '<ol></details></section><section class="experiment own-widgets latest-commits">';

                    file = file.replace('<section class="experiment own-widgets latest-commits">', otherweb);
                }
            } catch (e) { }

            try {
                var docs = (fs.readdirSync('docs') || []);

                if (docs.length) {
                    var html = '<section class="experiment" id="docs">';
                    html += '<details><summary style="text-align:center;">RTCMultiConnection Docs</summary>';
                    html += '<h2 style="text-align:center;display:block;"><a href="http://www.rtcmulticonnection.org/docs/">http://www.rtcmulticonnection.org/docs/</a></h2>';
                    html += '<ol>';

                    docs.forEach(function (f) {
                        if (f.indexOf('DS_Store') == -1) {
                            html += '<li><a href="https://github.com/muaz-khan/RTCMultiConnection/tree/master/docs/' + f + '">' + f + '</a></li>';
                        }
                    });

                    html += '</ol></details></section><section class="experiment own-widgets latest-commits">';

                    file = file.replace('<section class="experiment own-widgets latest-commits">', html);
                }
            } catch (e) { }

            response.writeHead(200, {
                'Content-Type': contentType
            });
            response.write(file, 'binary');
            response.end();
        });
    } catch (e) {
        response.writeHead(404, {
            'Content-Type': 'text/plain'
        });
        response.write('<h1>Unexpected error:</h1><br><br>' + e.stack || e.message || JSON.stringify(e));
        response.end();
    }
}

var app;
var sess;
var testid;

//---------------------------db---------------------------------//
var express = require('express');
var bodyParser = require('body-parser');
var session = require('express-session');

app = express();

app.use(session({
    secret: '@#@$MYSIGN#@$#$',
    resave: false,
    saveUninitialized: true
}));

app.use(bodyParser.urlencoded({ extended: true }));

app.post("/web/Counselor", function (req, res) {
	res.setHeader("Access-Control-Allow-Origin", ip_addr);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
	
    var mysql = require('mysql');
    var dbConnection = mysql.createConnection({
        host: '192.168.10.104',
        user: 'root',
        port: 3306,
        password: '!!tlsxpr12',
        database: 'mysql'
    });
    dbConnection.connect(function (err) {
        if (err) {
            console.log(err + " Error connecting database ... \n\n");
        } else {
            console.log("connecting database ... \n\n");
            var sql = "Insert Into counselorlog (counselor_id,store,start_date, end_date,calling_time) values ('" + req.session.user_id + "','" + req.body.roomid + "','" + req.body.startdate + "','" + req.body.enddate + "','" + req.body.calling_time + "')";
            dbConnection.query(sql, function (err, result) {
                if (err) throw err;
                console.log("1 record inserted");
            });
        }
    });
    res.writeHead(301,
      { Location: ip_addr + '/web/counselor.html' }
    );
    res.end();
});


app.post('/web/login', function (req, res) {
    sess = req.session;
    var id = req.body.id;
    var password = req.body.password;

    var sql = "select count(*) cnt from member Where id=? and password=?"
    var mysql = require('mysql');
    var dbConnection = mysql.createConnection({
        host: mysql_addr,
        user: 'root',
        port: 3306,
        password: '!!tlsxpr12',
        database: 'mysql'
    });

    dbConnection.query(sql, [id, password], function (err, rows) {
        if (err) throw err;
        console.log('rows', rows);
        var cnt = rows[0].cnt;
        if (cnt == 1) {
            sess.user_id = id;
            res.send('<script>location.href="' + ip_addr + '/web/counselor.html";</script>');
        } else {
            res.send('<script>history.back();</script>');
        }
    });

});

app.get('/web/logout', function (req, res) {
    sess = req.session;
    if (sess.user_id) {
        req.session.destroy(function (err) {
            if (err) {
                console.log(err);
            } else {
                res.redirect(ip_addr + '/web/login/index.html');
            }
        })
    } else {
        res.redirect(ip_addr + '/web/login/index.html');
    }
});

app.get('/web/check', function (req, res) {
    sess = req.session;
    res.setHeader("Access-Control-Allow-Origin", ip_addr);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (sess.user_id) {
        res.json({ user_id: sess.user_id });
    } else {
        res.json({ flag: true });
    }
});



var https = require('https');

https.createServer(options, app).listen(8000, function () {
    console.log('Server running at http://127.0.0.1:8000/');
});
//-----------------------------------------------------------------------//

if (isUseHTTPs) {
    app = server.createServer(options, serverHandler);
} else {
    app = server.createServer(serverHandler);
}

function cmd_exec(cmd, args, cb_stdout, cb_end) {
    var spawn = require('child_process').spawn,
        child = spawn(cmd, args),
        me = this;
    me.exit = 0;
    me.stdout = "";
    child.stdout.on('data', function (data) {
        cb_stdout(me, data)
    });
    child.stdout.on('end', function () {
        cb_end(me)
    });
}

function log_console() {
    console.log(foo.stdout);

    try {
        var pidToBeKilled = foo.stdout.split('\nnode    ')[1].split(' ')[0];
        console.log('------------------------------');
        console.log('Please execute below command:');
        console.log('\x1b[31m%s\x1b[0m ', 'kill ' + pidToBeKilled);
        console.log('Then try to run "server.js" again.');
        console.log('------------------------------');

    } catch (e) { }
}

function runServer() {
    app.on('error', function (e) {
        if (e.code == 'EADDRINUSE') {
            if (e.address === '0.0.0.0') {
                e.address = 'localhost';
            }

            var socketURL = (isUseHTTPs ? 'https' : 'http') + '://' + e.address + ':' + e.port + '/';

            console.log('------------------------------');
            console.log('\x1b[31m%s\x1b[0m ', 'Unable to listen on port: ' + e.port);
            console.log('\x1b[31m%s\x1b[0m ', socketURL + ' is already in use. Please kill below processes using "kill PID".');
            console.log('------------------------------');

            foo = new cmd_exec('lsof', ['-n', '-i4TCP:9001'],
                function (me, data) {
                    me.stdout += data.toString();
                },
                function (me) {
                    me.exit = 1;
                }
            );
            setTimeout(log_console, 250);
        }
    });

    app = app.listen(port, process.env.IP || '0.0.0.0', function (error) {
        var addr = app.address();

        if (addr.address === '0.0.0.0') {
            addr.address = 'localhost';
        }

        var domainURL = (isUseHTTPs ? 'https' : 'http') + '://' + addr.address + ':' + addr.port + '/';

        console.log('------------------------------');

        console.log('socket.io is listening at:');
        console.log('\x1b[31m%s\x1b[0m ', '\t' + domainURL);

        console.log('\n');

        console.log('Your web-browser (HTML file) MUST set this line:');
        console.log('\x1b[31m%s\x1b[0m ', 'connection.socketURL = "' + domainURL + '";');

        if (addr.address != 'localhost' && !isUseHTTPs) {
            console.log('Warning:');
            console.log('\x1b[31m%s\x1b[0m ', 'Please set isUseHTTPs=true to make sure audio,video and screen web can work on Google Chrome as well.');
        }

        console.log('------------------------------');
        console.log('Need help? http://bit.ly/2ff7QGk');
    });

    require('./Signaling-Server.js')(app, function (socket) {

        try {

            var params = socket.handshake.query;

            // "socket" object is totally in your own hands!
            // do whatever you want!

            // in your HTML page, you can access socket as following:
            // connection.socketCustomEvent = 'custom-message';
            // var socket = connection.getSocket();
            // socket.emit(connection.socketCustomEvent, { test: true });

            if (!params.socketCustomEvent) {
                params.socketCustomEvent = 'custom-message';
            }

            socket.on(params.socketCustomEvent, function (message) {
                try {
                    socket.broadcast.emit(params.socketCustomEvent, message);
                } catch (e) { }
            });
        } catch (e) { }
    });
}

if (autoRebootServerOnFailure) {
    // auto restart app on failure
    var cluster = require('cluster');
    if (cluster.isMaster) {
        cluster.fork();

        cluster.on('exit', function (worker, code, signal) {
            cluster.fork();
        });
    }

    if (cluster.isWorker) {
        runServer();
    }
} else {
    runServer();
}
