var name = 'shaunnope';
$.ajax({
type: 'GET',
 url: 'https://www.instagram.com/' + name,
 success: function (data) {
  data = JSON.parse(data.split("window._sharedData = ")[1].split(';')[0]).entry_data.ProfilePage[0];
  usr_id = data.graphql.user["id"];
  $.getJSON("https://i.instagram.com/api/v1/users/"+usr_id+"/info/", function(info) {
    path = info.user.hd_profile_pic_url_info["url"];
  });
 }
});
