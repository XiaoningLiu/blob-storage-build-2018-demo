var blobUri = 'https://2018ignitedemo.blob.core.windows.net/'
var container = 'media'
var blobService = null

  window.config = {
    instance: 'https://login.microsoftonline.com/',
    tenant: 'microsoft.onmicrosoft.com',
    clientId: '09031922-803e-47fa-831e-5934d4b88a77',
    cacheLocation: 'localStorage', // enable this for IE, as sessionStorage does not work for localhost.
    extraQueryParameter: 'prompt=consent',
    endpoints: {
      "https://storage.azure.com/": "09031922-803e-47fa-831e-5934d4b88a77"
    }
  }
  var authContext = new AuthenticationContext(config);

  // Check For & Handle Redirect From AAD After Login
  var isCallback = authContext.isCallback(window.location.hash)
  authContext.handleWindowCallback()
  if(authContext.getLoginError())
  {
    alert(authContext.getLoginError())
  }

  if (isCallback && !authContext.getLoginError()) {
    window.location = authContext._getItem(authContext.CONSTANTS.STORAGE.LOGIN_REQUEST)
  }

  // Check Login Status, Update UI
  var user = authContext.getCachedUser()
  if (user) {
    $("#login").hide()
    $("#logout").show()
  } else {
    $("#login").show()
    $("#logout").hide()
    $('#images').html('<blockquote><h3>You are not authorized to view this page.</h3></blockquote>')
  }

  $("#login").click(function () {
    authContext.login()
  });
  
  $("#logout").click(function () {
    authContext.logOut()
  });
  
  // Acquire Token for Backend
  authContext.acquireToken("https://storage.azure.com/", function (error, token) {
    // Handle ADAL Error
    if (error || !token) {
      authContext.acquireTokenRedirect("https://storage.azure.com/", null, null)
      console.log('ADAL Error Occurred: ' + error)
      return
    }
    
    console.log("Bearer " + token)

    var bearerToken = new AzureStorage.Blob.TokenCredential(token)
    blobService = AzureStorage.Blob.createBlobServiceWithTokenCredential(blobUri, bearerToken)
    
    listBlobs('images')
    listBlobs('videos')
  })

function upload() {
    
  $('#uploadResult').html('Uploading ...')

  var file = $('#uploadFile').prop('files')[0]

  // Image or video upload ?
  var fileExtension = file.name.split('.').pop()
  var blobPrefix = 'images/'
  var isImage = /jpe?g|png|gif/.test(fileExtension)
  var isVideo = /mpe?g|mp4/.test(fileExtension)

  if (isImage || isVideo) {
    blobPrefix = isImage ? 'images/' : 'videos/'
  } else {
    alert('File format not supported')
    $('#uploadResult').html('Upload a new file')
    return
  }
  
  blobService.createBlockBlobFromBrowserFile(container, blobPrefix + file.name, file, null, function (error, result, response) {
    if (error) {
      alert(error);
    } else {
      $('#uploadResult').html('Done!')
      setTimeout(function () {
        $('#uploadResult').html('Upload a new file!')
        listBlobs('images')
        listBlobs('videos')
      }, 2000)
    }
  })
}

function listBlobs(prefix) {
  
  blobService.listBlobsSegmentedWithPrefix(container, prefix, null, {include: 'metadata'}, function (error, results) {
    if (error) {
      console.log('Failed to list objects')
    } else {
      var listResult = ''
      for (var i = 0, blob; blob = results.entries[i]; i++) {
        var metadata = ''
        metadata = blob.metadata.caption ? blob.metadata.caption : ''
        var thumbUri, fullUri, duration = ''
        if (prefix === 'videos') {
          thumbUri = blobUri + container + '/thumbnails/' + blob.name.split('/').pop() + '.jpg'
          fullUri = blobUri + container + '/transcoded/' + blob.name.split('/').pop()
          duration = blob.metadata.duration ? blob.metadata.duration + ' sec' : ''
        } else {
          thumbUri = blobUri + container + '/' + blob.name
          fullUri = thumbUri
        }
        listResult += '<div class="col-md-4"><div class="card mb-4 box-shadow"><img class="card-img-top placeholder" alt="' + metadata + '" src="' + thumbUri + '" onerror="this.src=\'style/no-image.jpg\'"><div class="card-body"><p class="card-text">' + metadata + '</p><div class="d-flex justify-content-between align-items-center"><div class="btn-group"><button type="button" class="btn btn-primary"  data-toggle="modal" data-target="#viewMedia" data-src="' + fullUri + '">View</button><button type="button" class="btn btn-sm btn-outline-secondary" onClick="deleteBlob(\'' + blob.name + '\', \'' + prefix + '\');">Delete</button></div><i>' + duration + '</i></div></div></div></div>'
      }
      grid = $('#' + prefix)
      grid.html(listResult)
      Holder.run({
        images: '.placeholder'
      })
    }
  })

}

function deleteBlob(blobName, prefix){
  blobService.deleteBlob(container, blobName,  function (error, results) {
    if (error) {
        alert("Failed to delete the object")
    } else {
        console.log("deleted");
        listBlobs(prefix);
    }
  })
}

$(function() {
  $('#viewMedia').on('show.bs.modal', function (e) {
    var source = $(e.relatedTarget).attr('data-src')
    $('.img-responsive').attr('src', source)
  })
  
  $('#exampleModal').on('show.bs.modal', function (e) {
          var source = $(e.relatedTarget).attr('data-src');
    var extension = source.split('.').pop();
    if(extension == "mp4" || extension == "mpeg" || extension == "mpg"){
      $(".video-responsive").prop("hidden", false).attr("src", source);
      $(".img-responsive").removeAttr("src");
    } else {
      $(".img-responsive").attr("src", source);
      $(".video-responsive").removeAttr("src").prop("hidden", true);
    }
      })
  
  $('#exampleModal').on('hide.bs.modal', function (e) {
      $("video")[0].pause()
      $(".img-responsive").removeAttr("src");
      $(".video-responsive").removeAttr("src");
      $(".video-responsive").prop("hidden", true);
      })

  $('#uploadFile').change(function(e){
    upload()
  })

})
