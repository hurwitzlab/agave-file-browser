class AgaveFileBrowser {
    constructor(params) {
        var self = this;

        var element = $('#'+params.elementId);
        if (!params.elementID && !element) {
            console.error('Missing required target element');
            return;
        }
        this.element = element;
        this.baseUrl     = params.baseUrl;
        this.queryParams = params.queryParams;
        this.path        = params.path;
        this.busyIconUrl = params.busyIconUrl || 'spinner.gif';
        this.authToken   = params.authToken;
        this.selectCallback = params.selectCallback;
        this.formatCallback = params.formatCallback;
        this.updateCallback = params.updateCallback;

        // Initialize contents
        self.update();
    }

    update(path) {
        var self = this;

        this.busy(true)
            .getPath(path)
                .pipe(self.format.bind(self, path))
                .then(self.render.bind(self))
                .done(function() {
                    if (self.updateCallback)
                        self.updateCallback.call(this);
                });

        return this;
    }

    getPath(path) {
        var self = this;

        if (!path)
            path = this.path;

        var url = this.baseUrl + '/' + path;
        if (this.queryParams)
            url += '?' + this.queryParams;

        return $.ajax({
            type: 'GET',
            url: url,
            headers: {
                'Authorization': 'Bearer ' + self.authToken
            },
            data: {}
        });
    }

    format(path, response) {
        console.log(path, " ", response);
        if (!response) {
            console.warn('Empty response from server');
            return;
        }

        if (this.formatCallback)
            return this.formatCallback.call(this, path, response);

        // Default Agave response formatter
        return response.result.filter(function(item) { return (item.name != '.') }).map(function(item) {
            return {
                id: item.path,
                text: item.name,
                data: { type: item.type },
                icon: (item.type == 'dir' ? 'jstree-folder' : 'jstree-file')
            };
        });
    }

    render(items) {
        var self = this;

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
                        var id = data.selected[0];
                        if (self.selectCallback) {
                            var node = self.element.jstree().get_node(id);
                            self.selectCallback(node);
                        }
                    }
                )
                .bind("dblclick.jstree",
                    function(event) {
                        var node = $(event.target).closest("li");
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
        var self = this;
        var nodes = this.element.jstree().get_selected().map(function (id) {
            console.log(id);
            return self.element.jstree().get_node(id);
        });
        return nodes;
    }
}

export { AgaveFileBrowser };
