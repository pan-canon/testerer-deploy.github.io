$('input.search').on('keypress', function(event) {
	// console.log(event.keyCode)
	if (event.KeyCode === 13) {
		$('.search_field .btn.srch').trigger('click');		
	}
});
$('.search_field').on('click', '.btn.srch', ({target})=>{
	const $box = $(target).closest('.search_field');
	const $holder = $box.closest('header').find('.src_box');
	var srchText = $box.find('input.search:not(.adp)').val();
	const mQuery = window.matchMedia('screen and (max-width: 768px)');
	const $header = $(target).closest('header');
	if( mQuery.matches ){
		srchText = $('input.search.adp').val();
	}

	var result = [];
	let stored = [];
	for( let i = 0; i < pages.length; i++ ){
		let el = pages[i];
		$.ajax({
			url: el.link,
			async: false,
			success: function(html){
				var doc = document.documentElement.cloneNode();
				doc.innerHTML = html;
				let item = {
					"page":el,
					"content":doc.querySelector('.wrapper').innerHTML
				};
				stored.push(item);
			}
		})
	}
	for( let i = 0; i < stored.length; i ++ ){
		let el = stored[i];
		if( htmlStringMatchesQuery(el.content, srchText) ){
			let pEl = getElementsByText(el.content, srchText, 'p');
			let hEL = getElementsByText(el.content, srchText, 'h2');
			if( pEl.length > 0 ){
				result.push({
					'el':el,
					'tag':pEl
				})
			}
			if( hEL.length > 0 ){
				result.push({
					'el':el,
					'tag':hEL
				})
			}
		}
	}
	if( mQuery.matches ){
		$header.css({'overflow':'inherit'});
		$holder.animate({'right':'0'});
		$('body').addClass('noscroll');
	} else {
		$header.css({'overflow':'inherit'})
		$holder.animate({'right':'20px'});
	}
	$holder.on('click', '.ico.close', ()=>{
		$holder.animate({'right':'-100%'}).promise().done(()=>{$header.css({'overflow':'hidden'})});
		$holder.find('.cnt').children().remove();
		$('body').removeClass('noscroll');
	});
	if( result.length > 0 ){
		// console.log(result)
		let $content_box = $holder.find('.cnt');
		$holder.find('.cnt').children().remove();
		for( let i = 0; i < result.length; i++ ){
			let el = result[i];
			// console.log(el)
			let container = $content_box.find(`.cnt_box[data-head="${el.el.page.name}"]`);
			let item;
			// console.log(container)
			if( container.length == 0 ){
				let head = `<a href="${el.el.page.link}" class="cnt_box" data-head="${el.el.page.name}"><p class="cnt_head">${el.el.page.name}</p>`;
				let tail = "</a>";
				let links = [];
				// item = (`<div class="cnt_box" data-head="${el.el.page.name}"><p class="cnt_head">${el.el.page.name}</p></div>`);
				// console.log(el.tag)
				for(let j = 0; j < el.tag.length; j++){
					links.push($(el.tag[j]).prop('outerHTML'));
					// console.log(el.tag[j]);
				}
				// item.find('.cnt_box').prepend(`<a class="cnt_link" href="${el.el.page.link}">${el.el.page.tag}</a>`);
				// console.log(links);	
				item = head + links.join('') + tail;
			}
			// console.log(item)
			$content_box.append(item);
		}
	} else {
		let $content_box = $holder.find('.cnt');
		$holder.find('.cnt').children().remove();
		if( srchText !== '' ){
			$content_box.append(`<a href="javascript:;"><p class="cnt_head">По вашому запиту "${srchText}" нічого не знайдено</p>`);
		}
	}
});
const parseHTMLString = (() => {
  const parser = new DOMParser();
  return str => parser.parseFromString(str, "text/html");
})();

const getSearchStringForDoc = doc => {
  return [
    doc.title,
    doc.body.innerText
  ].map(str => str.trim())
   .join(" ");
};

const stringMatchesQuery = (str, query) => {
	console.log(query)
  str = str.toLowerCase();
  query = query.toLowerCase();
  
  return query
    .split(/\W+/)
    .some(q => str.includes(q))
};

const htmlStringMatchesQuery = (str, query) => {
	if( query === '' ){
		return false
	}
  const htmlDoc = parseHTMLString(str);
  const htmlSearchString = getSearchStringForDoc(htmlDoc);
  return stringMatchesQuery(htmlSearchString, query);
};

function getElementsByText(src, str, tag) {
	const doc = parseHTMLString(src);
	const call = Array.prototype.slice.call(doc.getElementsByTagName(tag));
	let res = [];
	call.filter(el => {
		if( el.textContent.trim().toLowerCase().includes(str.trim().toLowerCase()) ){
			res.push(el)
		}
	})
  return res
}

