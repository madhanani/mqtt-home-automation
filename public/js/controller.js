var socket = io();

var myApp = angular.module('myApp', []);

myApp.controller('AppCtrl', ['$scope', '$http', function($scope, $http) {

	var refreshPubTopic = function() {
		$http.get('/pubtopics').success(function(res) {
			$scope.pubtopics = res;	
			$scope.pubtopic = '';
		});
	};

	refreshPubTopic();

	$scope.addPubTopic = function() {
		$http.post('/addpubtopic', $scope.pubtopic).success(function(res) {
			refreshPubTopic();
		});
	};

	$scope.loadEditPubTopic = function(id) {
		$http.get('/pubtopics/' + id).success(function(res) {
			$scope.editpubtopic = res;
		});
	}

	$scope.editPubTopic = function(id) {
		$http.put('/editpubtopic/' + id, $scope.editpubtopic).success(function(res) {
			$scope.editpubtopic = '';
			refreshPubTopic();
		});
	};

	$scope.setJob = function(id) {
		$http.get('/pubtopics/' + id).success(function(res) {
			$scope.schedule = res;
		});
	}

	$scope.deletePubTopic = function(id) {
		$http.delete('/pubtopics/' + id).success(function(res) {
			refreshPubTopic();
		});
	}

	$scope.off = function(id) {
		$http.put('/pubtopics/' + id).success(function(res) {
			refreshPubTopic();
		});
	};

	$scope.on = function(id) {
		$http.put('/pubtopics/' + id).success(function(res) {
			refreshPubTopic();
		});
	};

	var refreshSubTopic = function() {
		$http.get('/subtopics').success(function(res) {
			$scope.subtopics = res;	
		});
	};

	refreshSubTopic();

	$scope.addSubTopic = function() {
		$http.post('/addsubtopic', $scope.subtopic).success(function(res) {
			$scope.subtopic = '';
			refreshSubTopic();
		});
	};

	$scope.loadEditSubTopic = function(id) {
		$http.get('/subtopics/' + id).success(function(res) {
			$scope.editsubtopic = res;
		});
	}

	$scope.editSubTopic = function(id) {
		$http.put('/editsubtopic/' + id, $scope.editsubtopic).success(function(res) {
			$scope.editsubtopic = '';
			refreshSubTopic();
		});
	};

	$scope.deleteSubTopic = function(id) {
		$http.delete('/subtopics/' + id).success(function(res) {
			refreshSubTopic();
		});
	}


	var refreshSchedule = function() {
		$http.get('/schedules').success(function(res) {
			$scope.schedules = res;	
			$scope.schedule = '';
		});
	};

	refreshSchedule();

	$scope.saveSchedule = function() {
		$http.post('/addschedule', $scope.schedule).success(function(res) {
			refreshSchedule();
		});
	};

	$scope.deleteSchedule = function(name) {
		$http.delete('/schedules/' + name).success(function(res) {
			refreshSchedule();
		});
	}

	socket.on('subscription', function() {
		refreshSubTopic();
	});

	socket.on('update publish', function(data) {
		$http.put('/pubtopics/' + data.topic._id, data.topic).success(function(res) {
			refreshPubTopic();
		});

		$http.delete('/schedules/' + data.doc.schedulename).success(function(res) {
			refreshSchedule();
		});
	});

	socket.on('schedule cancel', function() {
		console.log("Requested Schedule has been Canceled!");
	});

}]);

