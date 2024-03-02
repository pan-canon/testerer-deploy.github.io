const main = new Swiper('.swiper.promo_main', {
	slidesPerView: 1,
	centeredSlides: true,
	loop: true,
	speed: 700,
	pagination: {
    el: '.swiper-pagination',
		clickable: true
  },
	autoplay: {
		disableOnInteraction: true,
		delay: 4000
	}
});
// main-promo
const top_sales = new Swiper('.sales.top_sales .sales_body.swiper', {
	slidesPerView: 4,
	spaceBetween: 20,
	centeredSlides: false,
	loop: false,
	navigation: {
		prevEl: '.sales.top_sales .slide_controls .prev',
		nextEl: '.sales.top_sales .slide_controls .next'
	},
});
const new_sales = new Swiper('.sales.new_sales .sales_body.swiper', {
	slidesPerView: 4,
	spaceBetween: 20,
	centeredSlides: false,
	loop: false,
	navigation: {
		prevEl: '.sales.new_sales .slide_controls .prev',
		nextEl: '.sales.new_sales .slide_controls .next'
	},
});
const sale_sales = new Swiper('.sales.sale_sales .sales_body.swiper', {
	slidesPerView: 4,
	spaceBetween: 20,
	centeredSlides: false,
	loop: false,
	navigation: {
		prevEl: '.sales.sale_sales .slide_controls .prev',
		nextEl: '.sales.sale_sales .slide_controls .next'
	},
});
const recommend_sales = new Swiper('.sales.recommend_sales .sales_body.swiper', {
	slidesPerView: 4,
	spaceBetween: 15,
	centeredSlides: false,
	loop: false,
	navigation: {
		prevEl: '.sales.recommend_sales .slide_controls .prev',
		nextEl: '.sales.recommend_sales .slide_controls .next'
	}
});
const splicingSwiper = new Swiper('.swiper.promo_splicing', {
	slidesPerView: 1,
	centeredSlides: true,
	loop: false,
	speed: 700,
	pagination: {
    el: '.swiper-pagination',
		clickable: true
  },
});
$(function(){
	const mQuery = window.matchMedia('screen and (max-width: 768px)');
	if( mQuery.matches ){
		$('.menu.row_menu').on('click', function(){
			let $self = $(this);
			if( $self.hasClass('active') ){
				$.when($self.animate({'height': '13.33333vw'}, 250))
					.then(function(){
						$self.toggleClass('active')
					});
			} else {
				$.when($self.animate({'height': '163.33333vw'}, 250))
					.then(function(){
						$self.toggleClass('active')
					});
			}
		});
		$('.filter .expander_btn').on('click', ({target})=>{
			let $parent = $(target).closest('.catalog_body');
			let shift = $parent.hasClass('menu_open') ? '-76vw' : '0';
			$.when($parent.animate({'left':shift}), 250)
				.then(()=>{
					$parent.toggleClass('menu_open')
				});
		});
	}
	$('.table_sw').on('click', '.sw_item:not(.active)', function(){
		let index = $(this).attr('data-pointer');
		$('.table.table_sw').find('.sw_item.active').removeClass('active');
		$(this).addClass('active');
		if( $(this).closest('.table_sw').hasClass('inner_body') ){
			$('.table.table_body').find('.body_item').find('td.active').removeClass('active');
			$('.table.table_body').find('.body_item').find(`td[data-target=${index}]`).addClass('active');
			let scrollpos = $('.table.table_body').find('.body_item').find(`td[data-target=${index}]`).offset().top,
				user_viewport = $(window).height(),
				scrolllevel = 0;
			if( mQuery.matches ){
				scrollpos -= $(this).closest('.table_sw').height();
				scrolllevel = (scrollpos) - (user_viewport / 5);
			} else {
				scrolllevel = (scrollpos) - (user_viewport / 3);
			}
			$('html, body').animate({ 
				scrollTop: scrolllevel
			}, 500);
		} else {
			$.when($('.table.table_body').find('.body_item.active').fadeOut())
				.then(function(){
					$('.table.table_body').find('.body_item.active').removeClass('active');
					$('.table.table_body').find(`.body_item[data-target=${index}]`).fadeIn().addClass('active');
				});
		}
	});
	$('.ico.star, .ico.buy').on('click', function(){
		$(this).toggleClass('un');
	});
	$('.filter').on('click', '.all_trigger', function(){
		$(this).closest('.box').find('.collapse').removeClass('collapse');
		$(this).hide();
	});
	$('.filter').on('click', '.filter_item .del', function(){
		let id = $(this).closest('.filter_item').attr('data-id');
		$('.filter').find(`input#${id}`).prop("checked", false);
		$(this).closest('.filter_item').remove();
		// to FUNC! (repeat)
		if( $('.filter').find('.box.used_data').find('.filter_body').find('.filter_item').length === 0 ){
			$('.filter').find('.box.used_data').find('.filter_body').find('.apply_filter').removeClass('shown');
		} else {
			$('.filter').find('.box.used_data').find('.filter_body').find('.apply_filter').addClass('shown');
		}
	});
	$('.filter').find('input[type="checkbox"]').on('change', function(){
		let id = $(this).attr('id'),
			name = $(this).closest('.chk_item').find('p.key').clone() //clone the element
			.children() //select all the children
			.remove() //remove all the children
			.end() //again go back to selected element
			.text();
		if( !$(this).closest('.box').hasClass('label') ){
			if( $(this).is(':checked') ){
				/*
					Тип техніки: 1
					Серія: 2
				*/
				let serie = id.split('_')[id.split('_').length - 1];
				let marker = id.indexOf('mach_') !== -1 ? 1 : 2;
				let body = {
					"id": id,
					"marker": marker,
					"type": $(this).closest('li').attr('data-type'),
					"cat": $(this).closest('li').attr('data-serie'),
					"serie": serie
				}
				$('.filter').find('.box.used_data').find('.filter_body').append(
					`<div class="filter_item" data-id="${id}" data-body='${JSON.stringify(body)}'><span>${name}</span><i class="ico del"></i></div>`
				)
			} else {
				$('.filter').find('.box.used_data').find('.filter_body').find(`.filter_item[data-id="${id}"]`).remove();
			}
			// to FUNC! (repeat)
			if( $('.filter').find('.box.used_data').find('.filter_body').find('.filter_item').length === 0 ){
				$('.filter').find('.box.used_data').find('.filter_body').find('.apply_filter').removeClass('shown');
			} else {
				$('.filter').find('.box.used_data').find('.filter_body').find('.apply_filter').addClass('shown');
			}
		}
	});
	$('.filter').find('.btn.clear_filter').on('click', function(){
		$('.filter').find('.box.used_data').find('.filter_body').find('.filter_item').remove();
		$('.filter').find('.box.used_data').find('.filter_body').find('.apply_filter').removeClass('shown');
		$('.filter').find('.box.chkbox:not(.label)').find('input[type="checkbox"]').prop("checked", false);
	});
	$('.filter').find('.ico.toggle').on('click', function(){
		let $self = $(this);
		if( $self.hasClass('open') ){
			$self.removeClass('open')
			$.when($self.closest('.box').find('.filter_body').animate({'opacity':'1'}, 250))
				.then(function(){
					$self.closest('.box').find('.filter_body').fadeIn(250);
				});
		} else {
			$self.addClass('open')
			$.when($self.closest('.box').find('.filter_body').animate({'opacity':'0'}, 250))
				.then(function(){
					$self.closest('.box').find('.filter_body').fadeOut(250);
				});
		}
	});
	$('.box.label').on('change', 'input[type="checkbox"]', function(){
		let $self = $(this),
			$parent = $self.closest('ul.filter_body'),
			used = $self.attr('data-point'),
			id = $self.attr('id');

		$parent.find('input[type="checkbox"]').each(function(__n,el){
			if( $(el).attr('data-point') !== used ){
				$(el).prop('checked', false);
			}
		});

		$('.filter').find('.box.chkbox:not(.label)').find('input[type="checkbox"]').prop('checked', false);
		$('.filter').find('.filter_item').remove();
		$('.filter').find('.apply_filter').removeClass('shown');
		$('.filter').find('.box.chkbox:not(.label)').find('ul.filter_body').find(`li.chk_item:not([data-label=${used}])`).css({'display': 'none'});
		$('.filter').find('.box.chkbox:not(.label)').find('ul.filter_body').find(`li.chk_item[data-label=${used}]`).css({'display': 'flex'});
		// show more handle
		$('.filter').find('.box.chkbox:not(.label)').each(function(__n,el){
			$(el).find('.filter_body.collapse').removeClass('collapse');
			$(el).find('.all_trigger').hide();
		});
		// filter items
		if( id.indexOf('label') !== -1 ){
			// by label
			$.when($('.catalog_body').find('.items_wrap').find(`.item`).fadeOut(250))
				.then($('.catalog_body').find('.items_wrap').find(`.item[brand=${id}]`).fadeIn(250));
		}
	});
	$('.filter').find('.btn.apply_filter').on('click', function(){
		$.when($('.catalog_body').find('.items_wrap').find('.item').fadeOut(250))
		.then(function(){
			$('.filter').find('.box.used_data').find('.filter_body').find('.filter_item').each(function(__n,el){
				let data = JSON.parse($(el).attr('data-body'));
				console.log(data.marker,data.marker === 2)
				if( data.marker === 1 ){
					$('.catalog_body').find('.items_wrap').find('.item').fadeOut(250);
					$('.catalog_body').find('.items_wrap').find(`.item[serie=${data.serie}]`).fadeIn(250);
				} else if( data.marker === 2 ){
					$('.catalog_body').find('.items_wrap').find('.item').fadeOut(250);
					$('.catalog_body').find('.items_wrap').find(`.item[cat="${data.cat}"]`).fadeIn(250);
				}
			});
		});
		$('.wrapper.catalog').find('pagenator').fadeOut()
	});
	$('.switch_holder').on('click', '.sw_item', function(){
		let $self = $(this),
			$parent = $self.closest('.sw_wrap'),
			pointer = parseInt($self.attr('data-pointer'), 10),
			image = $self.attr('data-image');

		if( pointer !== 0 ){
			$parent.find('.sw_item.active').removeClass('active');
			$self.addClass('active');
			$.when($parent.find('.switch_target').find('.text_wrap.active').fadeOut(150).removeClass('active'))
				.then(function(){
					$parent.find('.switch_target').find(`.text_wrap[sw-target="${pointer}"]`).fadeIn(150).addClass('active');
					if( image !== '' ){
						$parent.find('.switch_target').find('.sw_image').attr('style', image);
					}
				});
		}
	});
	$('.onhover .switch_holder').on('mouseover', '.sw_item', function(){
		let $self = $(this);
		if( !$self.hasClass('active') ){
			$self.trigger('click');
		}
	});
	$('.onhover .switch_holder').on('click', '.sw_item.active', ({target})=>{
		let $self = $(target),
			pointer = $self.attr('data-pointer'),
			uri = $self.closest('.sw_wrap').find(`.text_wrap[sw-target=${pointer}]`)
				.find('a.arrow').attr('href');

		if( uri != '' ){
			window.location = uri;
		}
	});
	// $('.question_block').on('click', 'a.btn.send.form', function(){
	// 	$(this).find('.feedback_form').fadeToggle();
	// });
	anchorScroll();
	$('a.box.move_to').on('click', ({target})=>{
		anchorScroll($(target).closest('.move_to').attr('href'));
	});
	// MODAL
	$('input[name="form_phone"]').mask('+38(099)999-99-99');
	$('.question_modal').find('input[type="text"], textarea[name="form_comment"]').on('keypress', ()=>{
		let email_flag = $('input[name="form_email"]').val() === '' ? false : true;
		let phone_flag = $('input[name="form_phone"]').val() === '' ? false : true;
		email_flag = email_flag ? $('input[name="form_email"]')[0].validity.valid : true;
		if( phone_flag && ($('input[name="form_email"]').val() === '' || $('input[name="form_email"]')[0].validity.valid) ){
			$('a.btn.form_submit').removeAttr('disabled');
		} else {
			$('a.btn.form_submit').attr('disabled', true);
		}
	});
	$('.question_block a.btn.send.form, .promo_splicing a.btn.send.form').on('click', ()=>{
		$.when($('.modal_bg').fadeIn(150)).then(()=>{
			$('.question_modal').animate({'right': 0}, 250);	
		})
	});
	$('.question_modal a.ico.del').on('click', ()=>{
		$('.question_modal').animate({'right': "-100%"}, 250, ()=>{
			clearCallMeForm();
			$('.modal_bg').fadeOut(150);
		});
	});
	$('a.btn.form_submit').on('click', ()=>{
		let ok = true;
		let request_data = {};
		// let voc = request_voc.dev;
		let voc = request_voc.prod;
		request_data["client"] = {
			"name":$('input[name="form_name"]').val(),
			"phone":$('input[name="form_phone"]').val(),
			"email":$('input[name="form_email"]').val(),
			"comment":`[${voc[window.location.pathname]}]\n${$('textarea[name="form_comment"]').val()}`,
		};
		$('a.btn.form_submit').attr('disabled', true);
		if( ok ){

			$.ajax({
				url:'https://mailsender.rb-idea.com/api/v1/send/callme',
				// url:'http://http://92.249.124.216:8111/api/v1/send/shop-cart',
				type:'POST',
				dataType: 'json',
				contentType: 'application/json',
				beforeSend: function(request) {
					request.setRequestHeader("token", "54268hla-791g-4658-7g9h-781354965472"); // TODO Request TOKEN
				},
				data:JSON.stringify(request_data),
				success:(ret,__textStatus,xhr)=>{
					if( xhr.status === 200 ){
						$('.question_modal').find('.modal_body[data-stage="1"]').hide();
						$('.question_modal').find('.modal_body[data-stage="2"]').show();
						clearCallMeForm();
						setTimeout(()=>{
							$('.question_modal').find('a.ico.del').trigger('click');
						}, 3000);
					}
					// console.log(ret);
					// if( ret.ok ){
					// 	window.location.reload;
					// }
				}
			});
		}
	});
});
const clearCallMeForm = () => {
	$('.question_modal').find('.modal_body[data-stage="2"]').hide();
	$('.question_modal').find('input').val('');
	$('.question_modal').find('textarea').val('');
	$('.question_modal').find('.modal_body[data-stage="1"]').show();
};
const anchorScroll = (uri) => {
	const hash = uri ? uri : window.location.hash;
	if( hash !== '' ){
		let anchor = hash.split('_');
		if( anchor.length >= 2 ){
			let pointer = anchor[0].replace('#',''),
				anchor2 = anchor[1].split('-')[1],
				block_pos = isNaN(parseInt(anchor2, 10)) ? 0 : parseInt(anchor2, 10);
			console.log(pointer)
			switch( pointer ){
				case 'about':
					if( $('.wrapper').hasClass('about_company') ){
						$('html, body').animate({ 
							scrollTop: $($(`.wrapper.${pointer}`).children()[block_pos+1]).offset().top
						}, 500);
					}
					break
				case 'fertilizers-page':
					if( $('.wrapper').hasClass(pointer) ){
						$('html, body').animate({ 
							scrollTop: $($(`.wrapper.${pointer}`).find('article.group_wrapper').children()[block_pos]).offset().top
						}, 500);
					}
					break
				case 'packService':
					if( $('.wrapper').hasClass('pack_service') ){
						$('html, body').animate({ 
							scrollTop: $($(`.wrapper.pack_service`).children()[block_pos+1]).offset().top
						}, 500);
					}
					break
				default:
					console.log($(`.wrapper.${pointer}`).children())
					if( $(`.wrapper`).hasClass(pointer) ){
						$('html, body').animate({ 
							scrollTop: $($(`.wrapper.${pointer}`).children()[block_pos+1]).offset().top
						}, 500);
					}
			}
		}
	}
}
// blinking fix https://codepen.io/mirta91/pen/bKPzed
// const mach_main_slider = new Swiper('.agrospace .main_news  .alt_news.swiper', {
// 	slidesPerView: 'auto',
// 	centeredSlides: false,
// 	loadPrevNext: true,
// 	loop: false
// });
// const mach_secondary_slider = new Swiper('.agrospace .main_news .main_news_gal.swiper', {
// 	slidesPerView: 'auto',
// 	spaceBetween: 40,
// 	centeredSlides: true,
// 	loop: false,
// 	navigation: {
// 		prevEl: '.main_news .gal_controls .prev',
// 		nextEl: '.main_news .gal_controls .next'
// 	},
// 	pagination: {
// 		el: ".news_pagination",
// 		type: "progressbar",
// 	},
// });
// mach_main_slider.controller.control = mach_secondary_slider;
// mach_secondary_slider.controller.control = mach_main_slider;
$('.wrapper.info_page').on('click', '.part_head', function(){
	let $self = $(this),
		$parent = $self.closest('.part_data')
	if( $parent.hasClass('active') ){
		$.when($parent.find('.part_body').slideUp()).then(function(){
			$parent.toggleClass('active');
		});
	} else {
		$.when($parent.find('.part_body').slideDown()).then(function(){
			$parent.toggleClass('active');
		});
	} 
});
$('.mission').on('click', '.round:not(.active)', function(){
	let index = $(this).attr('data-pointer');
	$('.mission').find('.round.active').removeClass('active');
	$(this).addClass('active');
	$.when($('.mission').find('.text_wrap.active').fadeOut())
		.then(function(){
			$('.mission').find('.text_wrap.active').removeClass('active');
			$('.mission').find(`.text_wrap[data-target=${index}]`).fadeIn().addClass('active');
		});
});
const video_slider = new Swiper('.about_company  .main_video_gal.swiper', {
	slidesPerView: 2,
	spaceBetween: 80,
	centeredSlides: true,
	loadPrevNext: true,
	loop: false,
	navigation: {
		prevEl: '.main_video_gal .gal_controls .prev',
		nextEl: '.main_video_gal .gal_controls .next'
	},
	pagination: {
		el: ".gal_pagination",
		type: "progressbar",
	},
	breakpoints: {
    // mobile + tablet - 320-990
    320: {
      slidesPerView: 1
    },
    // desktop >= 991
    991: {
      slidesPerView: 2
    }
  }
});
const blog_slider = new Swiper('.blog_page  .main_video_gal.swiper', {
	slidesPerView: 1.56,
	spaceBetween: 80,
	centeredSlides: true,
	loadPrevNext: true,
	loop: false,
	navigation: {
		prevEl: '.main_video_gal .gal_controls .prev',
		nextEl: '.main_video_gal .gal_controls .next'
	},
	pagination: {
		el: ".gal_pagination",
		type: "progressbar",
	},
	breakpoints: {
    // mobile + tablet - 320-990
    320: {
      slidesPerView: 1
    },
    // desktop >= 991
    991: {
      slidesPerView: 1.56
    }
  }
});
if( $('.wrapper').hasClass('blog_page') ){
	$('.blog').find('.box.bg').on('click', ({target})=>{
		const $self = $(target).closest('a.box.bg');
		const pos = $self.index();

		$([document.documentElement, document.body]).animate({
			scrollTop: 250
		}, 1000);

		blog_slider.slideTo(pos);
	});
}
// AGROSPACE
const ags_main_slider = new Swiper('.agrospace  .alt_news.swiper', {
	slidesPerView: 'auto',
	centeredSlides: false,
	loadPrevNext: true,
	loop: false,
	breakpoints: {
    // mobile + tablet - 320-990
    320: {
      slidesPerView: 1,
    },
    // desktop >= 991
    991: {
      slidesPerView: 1
    }
  }
});
const ags_secondary_slider = new Swiper('.agrospace .main_news_gal.swiper', {
	slidesPerView: 'auto',
	spaceBetween: 40,
	centeredSlides: true,
	loop: false,
	navigation: {
		prevEl: '.agrospace .gal_controls .prev',
		nextEl: '.agrospace .gal_controls .next'
	},
	pagination: {
		el: ".news_pagination",
		type: "progressbar",
	},
	breakpoints: {
    // mobile + tablet - 320-990
    320: {
      slidesPerView: 1
    },
    // desktop >= 991
    991: {
      slidesPerView: 1
    }
  }
});
ags_main_slider.controller.control = ags_secondary_slider;
ags_secondary_slider.controller.control = ags_main_slider;

$('a.anchor').on('click', function(){
	let id = $(this).attr('anchor'),
		target = $(`#${id}`);

	$([document.documentElement, document.body]).animate({
		scrollTop: $(target).offset().top
	}, 2000);
});

$('footer.main_footer.dsk').on('click', '.btn.to_top', function(){
	$([document.documentElement, document.body]).animate({
		scrollTop: 0
	}, 2000);
});

$('.about_company').on('click', 'a.arrow.red', function(){
	let $self = $(this),
		$parent = $self.closest('.blog').find('.box_wrap'),
		$children = $parent.find('a.box');

	let i = 5;
	var loop = window.setInterval(function () {
		i++;
		$($children[i]).fadeIn(250);
		if (i == $children.length)
			clearInterval(loop);
	}, 250);
	$self.closest('.service_tail').fadeOut()
});

if( $(".table_init").length !== 0 ){
	const $table = $(".table_init");
	$table.each((__,el)=>{
		const filename = $(el).attr('data-source');
		$.ajax(`../table/${filename}`,{
			type: 'GET',
			// contentType: 'text/html;charset=utf-8',
			dataType: 'html',
			success:(ret)=>{
				// let retData = $(ret).html()
				// // $($(ret)[1]).html(`<meta http-equiv="Content-Type" content="text/html; charset=utf-8">`);
				// // $($(ret)[1]).attr('content', 'text/html; charset=utf-8'),
				// console.log(
				// 	retData
				// 	// $($(ret)[1]).attr('content'),
				// 	// $(ret),
				// 	// $(document),
				// 	// ret.querySelector('table')
				// 	)
				
				// // $(ret).each((__n,element) => {
				// // 	console.log(__n,element)
				// // 	if( $(element).attr('http-equiv') == "Content-Type" ){
				// // 		$(element).attr('content', 'text/html; charset=utf-8');
				// // 		console.log("inside:",ret[__n])
				// // 	}
				// // 	console.log("after_loop:", element)
				// // });
				$(el).html(`<table>${$(ret).find('tbody').html()}</table>`);
			}
		});
	});
}
$('.partners').on('click', '.p_item', ({target})=>{
	const $self = $(target),
		content = $self.attr('content'),
		$content = $self.closest('.partners').find('.content');
	if( content ){
		$content.find('.body').html(content);
		$content.toggleClass('front');
		$content.animate({'opacity': 1}, 150);
	}
});
$('.partners').on('click', '.content i', ({target})=>{
	const $modal = $(target).closest('.content');
	$modal.animate({'opacity':0}, 150, ()=>{
		$modal.toggleClass('front');
	});
});
if( $('article.group_wrapper').length != 0 ){
	$('article.group_wrapper').find('section.group_wrap').each((__n,el)=>{
		let $self = $(el),
			$swiper = $self.find('.items_wrap'),
			$controls = $self.find('.wrapper_constrols'),
			$tags = $self.find('.tags_head'),
			idtag = $self.attr('id');
		$tags.find('.tag').eq(0).addClass('active');
		
		let __swipe = new Swiper(`#${idtag} .swiper`, {
			slidesPerView: 1,
			spaceBetween: 0,
			centeredSlides: false,
			loop: false,
			navigation: {
				prevEl: `#${idtag} .swiper .prev`,
				nextEl: `#${idtag} .swiper .next`
			},
			on:{
				slideChange: (swiper) => {
					const index_currentSlide = swiper.realIndex;
					const currentSlide = swiper.slides[index_currentSlide]
					//
					let $head = $(`section.group_wrap#${idtag}`).find('.tags_head');
					$head.find('.active').removeClass('active');
					$head.find('.tag').eq(index_currentSlide).addClass('active');
					console.log({
						1: index_currentSlide,
						2: currentSlide,
						3:$(`section.group_wrap#${idtag}`),
						4:`section.group_wrap#group_${idtag}`
					})
				},
			}
		});
		$tags.on('click', '.tag:not(.active)', ({target})=>{
			let curIndex = $(target).index();
			__swipe.slideTo( curIndex );
		})
	})
}