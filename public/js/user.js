var myApp = angular.module('myApp', []);

myApp.controller('AppCtrl', ['$scope', '$http', function($scope, $http) {

	$http.get('/pubtopics').success(function(res) {
		console.log(res);
		$scope.pubtopics = res;	
	});

	$http.get('/subtopics').success(function(res) {
		console.log(res);
		$scope.subtopics = res;	
	});

}]);

