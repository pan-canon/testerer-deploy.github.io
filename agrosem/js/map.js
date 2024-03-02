// console.log(Object.entries(contactsJSON))
let map, markers = [],
	center = { lat: 48.832, lng: 31.451 },
	initMarkers = Object.entries(contactsJSON).reduce(
		(resArr, curArr) => {
			let used_id = curArr[0]
			let usedIdArr = curArr[1]
			usedIdArr.forEach(arr => {
				if (arr.marker){
					let coords = JSON.parse(arr.marker)
					let marker = {
						used_id,
						coords: {
							lat: coords[0], lng: coords[1]
						},
					}
					resArr.push(marker)
				}
			})
			return resArr
		}
	, [])
// console.log(initMarkers)
const USER_ZOOM = 6;

function placeMarker(location, used_id) {
	let marker = new google.maps.Marker({
		position: location,
		map, 
		icon: '/img/map/pin.svg',
		used_id,
	})

	marker.addListener("click", (e) => {
		// console.log(marker.used_id)
		$('#map_head').val(used_id).trigger("change")
	})

	markers.push(marker)
}

function setMapOnAll(map) {
	markers.forEach(m => {
		m.setMap(map)
	})
}

function deleteMarkers() {
	setMapOnAll(null);
  markers = [];
}

function showAllMarkers() {
	initMarkers.forEach(m => {
		placeMarker(m.coords, m.used_id)
	})
}

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: USER_ZOOM,
    center: new google.maps.LatLng(center),
    disableDefaultUI: true
  });

	showAllMarkers()
}

initMap();

$('#map_head').select2();

$('#map_head').on('change', ({target})=>{
	let used_id = $(target).find('option:selected').val();
	// let used_name = $(target).find('option:selected').html();
	
	$.when($('.table.table_body').find('.body_item.active').slideUp(250))
		.then(()=>{
			$('.table.table_body').find('.body_item.active').removeClass('active');
			$('.table.table_body').find(`.body_item[data-target="${used_id}"]`).slideDown(250);
			$('.table.table_body').find(`.body_item[data-target="${used_id}"]`).addClass('active');
		});
	
		// $('.table.table_sw').find('.alt_info').find('span.info').html(used_name);

	deleteMarkers()
	contactsJSON[used_id].forEach(c => {
		if (!c.marker) return
		let coords = JSON.parse(c.marker)
		let m = {lat: coords[0], lng: coords[1]}
		placeMarker(m, used_id)
	})
	if (!markers.length) showAllMarkers()
})