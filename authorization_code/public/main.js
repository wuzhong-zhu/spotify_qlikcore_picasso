import _ from 'lodash';
import $ from 'jquery';
import Halyard from 'halyard.js';
import angular from 'angular';
import enigma from 'enigma.js';
import enigmaMixin from 'halyard.js/dist/halyard-enigma-mixin';
import qixSchema from 'enigma.js/schemas/3.2.json';
import picasso from 'picasso.js';
import picassoQ from 'picasso-plugin-q';
import trackAnalysis from "./track-analysis.js"
// import artistAnalysis from "./artist-analysis.js"
// import recentAnalysis from "./recent-analysis.js"
import libraryAnalysis from "./library-analysis.js"

picasso.use(picassoQ);

(function() {
  function getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
       hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }
  function generateGUID (){
    var tempid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      // eslint-disable-next-line no-bitwise
      const r = Math.random() * 16 | 0;
      // eslint-disable-next-line no-bitwise
      const v = c === 'x' ? r : ((r & 0x3) | 0x8);
      return v.toString(16);
    });
    return tempid;
  };

  var userProfileSource = document.getElementById('user-profile-template').innerHTML,
      userProfileTemplate = Handlebars.compile(userProfileSource),
      userProfilePlaceholder = document.getElementById('user-profile');

  var oauthSource = document.getElementById('oauth-template').innerHTML,
      oauthTemplate = Handlebars.compile(oauthSource),
      oauthPlaceholder = document.getElementById('oauth');

  var params = getHashParams();

  var access_token = params.access_token,
      refresh_token = params.refresh_token,
      error = params.error;

  if (error) {
    alert('There was an error during the authentication');
  } else {
    if (access_token) {
      // render oauth info
      oauthPlaceholder.innerHTML = oauthTemplate({
        access_token: access_token,
        refresh_token: refresh_token
      });

      $.ajax({
          url: 'https://api.spotify.com/v1/me',
          headers: {
            'Authorization': 'Bearer ' + access_token
          },
          success: function(response) {
            userProfilePlaceholder.innerHTML = userProfileTemplate(response);

            $('#login').hide();
            $('#loggedin').show();
            document.getElementById('press-me').addEventListener('click', function(){trackAnalysis(access_token,generateGUID())}, true);
            // document.getElementById('press-me2').addEventListener('click', artistAnalysis(access_token,generateGUID())  , false);
            // document.getElementById('press-me3').addEventListener('click', recentAnalysis(access_token,generateGUID())  , false);
            document.getElementById('press-me4').addEventListener('click', function(){libraryAnalysis(access_token,generateGUID())}  , false);

            trackAnalysis(access_token,generateGUID());
          }
      });
    } else {
        // render initial screen
        $('#login').show();
        $('#loggedin').hide();
    }
  }
})();