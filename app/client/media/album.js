n('piksha.media', function (ns) {
  ns.Album = React.createClass({
    getInitialState: function() {
      return {album: null};
    },
    componentDidMount: function() {
      var self = this;
      var mediaService = piksha.media.MediaService.create();
      mediaService.asset(this.props.albumUrl).then(function (album) {
        self.setState({album: album});
      });
    },
    showAlbums: function (e) {
      e.preventDefault();
      piksha.application.Router.instance().changeRoute('overview');
    },
    render: function () {
      if (this.state.album) {
        var albumUrl = this.props.albumUrl;
        return <div>
            <nav>
              <a href="#" onClick={this.showAlbums}>Back</a>
            </nav>
            <ul>{this.state.album.photos.map(function (photo) { return <ns.PhotoTile photo={photo} albumUrl={albumUrl} />; })}</ul>
          </div>;
      } else {
        return <piksha.application.Loading />;
      }
    }
  });

  ns.PhotoTile = React.createClass({
    showPhoto: function (e) {
      e.preventDefault();
      piksha.application.Router.instance().changeRoute('photo', {
        photoUrl: this.props.photo.url,
        albumUrl: this.props.albumUrl
      });
    },
    render: function () {
      return <ns.Thumbnail src={this.props.photo.thumbnail} clickHandler={this.showPhoto} title={this.props.photo.title} />;
    }
  });
});
