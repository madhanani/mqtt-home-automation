var express = require('express');
var app = express();
var mongojs = require('mongojs');
var db = mongojs('demo', ['pubtopic', 'subtopic', 'schedule']);
var bodyParser = require('body-parser');
var schedule = require('node-schedule');
var mqtt = require('mqtt');

var client  = mqtt.connect('mqtt://119.159.122.138:1883/');

var server = app.listen(3000, function() {
	console.log('Server running on port 3000')
});

var io = require('socket.io')(server);

// Set socket.io listeners.
io.on('connection', function(socket) {
	console.log('User Connected');

	socket.on('disconnect', function() {
		console.log('User Disconnected');
	});

});

client.on('connect', function() {
	console.log("MQTT Connected");

	db.pubtopic.find(function(error, docs) {
		docs.forEach(function(val) {
			client.publish(val.username + "/" + val.topicname, val.value);
		}); 
	});

	db.subtopic.find(function(error, docs) {
		docs.forEach(function(value) {
			client.subscribe(value.username + "/" + value.topicname);
		}); 
	});
});
 
client.on('message', function (topic, message) {
	var username = topic.split("/")[0];
	var topicname = topic.split("/")[1];
	var value = message.toString();

	db.subtopic.findAndModify({
		query: {
			username: username,
			topicname: topicname
		},
		update: {
			$set: { value: value }
		},
		new: true
	},
	function(err, doc) {
		if(!err) {
			io.emit('subscription');
		}
	});
});

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());

app.get('/pubtopics', function(req, res) {	
	db.pubtopic.find(function(error, docs) {
		res.json(docs);
	});

});

app.post('/addpubtopic', function(req, res) {
	db.pubtopic.insert({ topicname: req.body.topicname, username: req.body.username, name: req.body.name, value: 'OFF' }, function(err, doc) {
		res.json(doc);
	});
});

app.delete('/pubtopics/:id', function(req, res) {
	var id = req.params.id;
	db.pubtopic.remove({_id: mongojs.ObjectId(id)},  function(err, doc) {
		res.json(doc);
	});
});

app.get('/pubtopics/:id', function(req, res) {
	var id = req.params.id;
	db.pubtopic.findOne({_id: mongojs.ObjectId(id)},  function(err, doc) {
		res.json(doc);
	});
});

app.put('/editpubtopic/:id', function(req, res) {
	var id = req.params.id;

	db.pubtopic.findAndModify({
		query: {
			_id: mongojs.ObjectId(id)
		},
		update: {
			$set: { name: req.body.name }
		},
		new: true
	},
	function(err, doc) {
		if(!err) {
			res.json(doc);
		}
	});
});

app.put('/pubtopics/:id', function(req, res) {
	var id = req.params.id;
	var state;

	db.pubtopic.findOne({_id: mongojs.ObjectId(id)},  function(err, doc) {
		if(doc.value == 'ON') {
			state = 'OFF';
		} else if(doc.value == 'OFF') {
			state = 'ON';
		} else {
			state = 'OFF';
		}

		db.pubtopic.findAndModify({
			query: {
				_id: mongojs.ObjectId(id)
			},
			update: {
				$set: { value: state }
			},
			new: true
		},
		function(err, doc) {
			if(!err) {
				client.publish(doc.username + "/" + doc.topicname, state);
				res.json(doc);
			}
		});

	});
});

app.get('/subtopics', function(req, res) {
	db.subtopic.find(function(error, docs) {
		res.json(docs);
	});

});

app.post('/addsubtopic', function(req, res) {
	db.subtopic.insert({ topicname: req.body.topicname, username: req.body.username, name: req.body.name }, function(err, doc) {
		res.json(doc);
		client.subscribe(req.body.username + "/" + req.body.topicname);
	});
});

app.get('/subtopics/:id', function(req, res) {
	var id = req.params.id;
	db.subtopic.findOne({_id: mongojs.ObjectId(id)},  function(err, doc) {
		res.json(doc);
	});
});

app.put('/editsubtopic/:id', function(req, res) {
	var id = req.params.id;

	db.subtopic.findAndModify({
		query: {
			_id: mongojs.ObjectId(id)
		},
		update: {
			$set: { name: req.body.name }
		},
		new: true
	},
	function(err, doc) {
		if(!err) {
			res.json(doc);
		}
	});
});

app.delete('/subtopics/:id', function(req, res) {
	var id = req.params.id;

	db.subtopic.findOne({_id: mongojs.ObjectId(id)},  function(err, doc) {
		client.unsubscribe(doc.username + "/" + doc.topicname);
	});

	db.subtopic.remove({_id: mongojs.ObjectId(id)},  function(err, doc) {
		res.json(doc);
	});
});


app.get('/schedules', function(req, res) {
	db.schedule.find(function(error, docs) {
		res.json(docs);
	});
});

app.post('/addschedule', function(req, res) {

	var randomString = function(length) {
	    var text = "";
	    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	    for(var i = 0; i < length; i++) {
	        text += possible.charAt(Math.floor(Math.random() * possible.length));
	    }
	    return text;
	}	

	var schedulename = randomString(10);

	db.schedule.insert({ topicname: req.body.topicname, username: req.body.username, name: req.body.name, schedulename: schedulename, datetime: req.body.datetime, value: req.body.value }, function(err, doc) {
		res.json(doc);
		if(!err) {
			var topic = req.body;
			var d = new Date(req.body.datetime);
			var date = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), 0);
			var j = new schedule.Job(doc.schedulename, function(){
				client.publish(doc.username + "/" + doc.topicname, doc.value);
				io.emit('update publish', { doc, topic });
			});

			j.on('canceled', function() {
				io.emit('schedule cancel');
			});

			j.schedule(date);
		}
	});
});

app.delete('/schedules/:schedulename', function(req, res) {
	var name = req.params.schedulename;

	var myjob = schedule.scheduledJobs[name];
	myjob.cancel();

	db.schedule.remove({schedulename: name},  function(err, doc) {
		res.json(doc);
	});
});



