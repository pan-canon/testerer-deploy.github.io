		window.onload = function() {
			try {
				TagCanvas.Start('root', 'memory_root', {
					activeAudio: true, 
					audioVolume: '2.0', 
					dragControl: true, 
					initial: [0.030, -0.070], 
					lock: 'xy', 
					maxSpeed: '0.05', 
					outlineMethod: "colour", 
					outlineColour: '#b22222', 
					padding: '20', 
					pinchZoom: false, 
					textFont: '"moret-variable", serif', 
					textColour: "#eee", 
				});
			} catch(e) {
				// something went wrong, hide the canvas container
				document.getElementById('b_memory_section').style.display = 'none';
			}
		};

		function selectBiopunk() {
			TagCanvas.Start('root', 'associative_biopunk', {
				activeAudio: "./audio/Go_Tell_Aunt_Rhody.ogg", 
				centreImage: './img/icon/biohazard.png', 
				dragControl: true, 
				initial: [0.200, 0.000], 
				padding: '20', 
				lock: 'y', 
				shape: 'DblHelix', 
				textFont: '"Press Start 2P", system-ui', 
				textColour: null, 
			});
		}

		function selectFolklore() {
			TagCanvas.Start('root', 'associative_folklore', {
				activeAudio: "./audio/Go_Tell_Aunt_Rhody.ogg", 
				centreImage: './img/icon/biohazard.png', 
				dragControl: true, 
				initial: [0.200, 0.000], 
				padding: '20', 
				shape: "vring(0.5)", 
				lock: "x", 
				offsetY: -60, 
				textFont: '"Henny Penny", system-ui', 
			});
		}

		function selectMadness() {
			TagCanvas.Start('root', 'associative_madness', {
				activeAudio: "./audio/Go_Tell_Aunt_Rhody.ogg", 
				centreImage: './img/icon/arkham.png', 
				dragControl: true, 
				initial: [0.200, 0.000], 
				shape: "hcylinder", 
				lock: "x", 
				textFont: '"Rye", serif', 
			});
		}

		function DblHelix(n, rx, ry, rz) {
			let a = Math.PI / n, i, j, p = [], z = rz * 2 / n;
			for(i = 0; i < n; ++i) {
				j = a * i;
				if (i % 2)
					j += Math.PI;
				p.push([rx * Math.cos(j), rz - z * i, ry * Math.sin(j)]);
			}
			return p;
		}