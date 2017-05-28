function formatTooltipTitle() {
  var data = $(this).attr('data-title');
  data = data.replace(/;/g, '<br>');
  return data;
}

function initTooltips() {
  var tooltips = $('div[data-toggle="tooltip"]').tooltip({
    title: formatTooltipTitle,
    html: true,
  });
}

$(function() {
  initTooltips();
});