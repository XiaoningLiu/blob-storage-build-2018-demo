$('#viewMedia').on('show.bs.modal', function (e) {
  var source = $(e.relatedTarget).attr('data-src')
  $('.img-responsive').attr('src', source)
})
