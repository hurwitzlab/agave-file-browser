class AgaveFileBrowser {
    constructor(params) {
    	let self = this;

        let element = $('#'+params.elementId);
        if (!params.elementID && !element) {
            console.error('Missing required target element');
            return;
        }
        this.element = element;
        this.baseUrl     = params.baseUrl;
        this.path        = params.path;
        this.busyIconUrl = params.busyIconUrl || 'spinner.gif';
        this.authToken   = params.authToken;
        this.selectCallback = params.selectCallback;
        this.formatCallback = params.formatCallback;

        // Initialize contents
        self.update();
	}

	update(path) {
		let self = this;

		this.busy(true)
            .getPath(path)
		    .pipe(self.format)
		    .done(self.render.bind(self));

		return this;
	}

	getPath(path) {
		let self = this;

		if (!path)
			path = this.path;
		let url = this.baseUrl + '/' + path;

		return $.ajax({
			type: 'GET',
			url: url,
			headers: {
			    'Authorization': 'Bearer ' + self.authToken
			},
			data: {}
		});
	}

	format(contents) {
		if (!contents || !contents.result) {
			console.warn('Empty response from server');
			return;
		}

        if (this.formatCallback)
            return this.formatCallback.call(this, contents);

	 	return contents.result.filter(function(item) { return (item.name != '.') }).map(function(item) {
	 		return { 
	 			id: item.path, 
	 			text: item.name, 
	 			data: { type: item.type },
	 			icon: (item.type == 'dir' ? 'jstree-folder' : 'jstree-file')
	 		};
	 	});		
	}

	render(items) {
		let self = this;

		if (!self.treeInit) {
			self.treeInit = 1;

		    self.element.hide().jstree("destroy").empty();
		    self.element.jstree({
                    core: {
                        check_callback: true,
                        data: items
                    },
                })
		    	.bind("select_node.jstree",
                    function (event, data) {
                        let id = data.selected[0];
                        if (self.selectCallback) {
                        	let node = self.element.jstree().get_node(id);
                        	self.selectCallback(node);
                        }
                    }
                )
                .bind("dblclick.jstree",
                	function(event) {
						let node = $(event.target).closest("li");
   						self.node = self.element.jstree().get_node(node[0].id);
                        if (self.node.data.type === 'dir' && !self.node.data.opened)
   						   setTimeout(self.update.bind(self, node[0].id), 10);
                	}
                )
                .show();

            return;
		}

		if (self.node) {
			items.forEach(function(item) {
				self.element.jstree().create_node(self.node, item, "last");
			});
			self.element.jstree().open_node(self.node);
            self.node.data.opened = true;
            self.busy(false);
		}
	}

    busy(enable) {
        var self = this;

        if (!self.node)
            return self;

        if (enable)
            self.element.jstree().set_icon(self.node, self.busyIconUrl);
        else
            self.element.jstree().set_icon(self.node, true);

        return self;
    }

    getSelectedNodes() {
        let self = this;
        let nodes = this.element.jstree().get_selected().map(function (id) {
            return self.element.jstree().get_node(id);
        });
        return nodes;
    }
}
