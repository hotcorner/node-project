function autocomplete(input, lat, lng, name) {
	if(!input) return;
	const dropdown = new google.maps.places.Autocomplete(input)
	dropdown.addListener('place_changed', () => {
		const place = dropdown.getPlace();
		console.log(place);
		lat.value = place.geometry.location.lat();
		lng.value = place.geometry.location.lng();
		name.value = place.name;
	});

	input.on('keydown', (e) => {
		if(e.keyCode === 13) e.preventDefault();
	})
}

export default autocomplete;