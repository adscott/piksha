n('piksha.media', function (ns) {
  ns.Album = React.createClass({
    getInitialState: function() {
      return {album: null};
    },
    componentDidMount: function() {
      var self = this;
      var mediaService = piksha.media.MediaService.create();
      mediaService.asset(this.props.album).then(function (album) {
        self.setState({album: album});
      });
    },
    render: function () {
      if (this.state.album) {
        return <div>
            <a href="#" onClick={this.props.showAlbums}>Back</a>
            <ul>{this.state.album.photos.map(function (photo) { return <ns.PhotoTile photo={photo} />; })}</ul>
          </div>;
      } else {
        return <img src="/client/assets/img/loader.gif" />;
      }
    }
  });

  ns.PhotoTile = React.createClass({
    render: function () {
      return <li className="thumbnail">
        <img src={this.props.photo.thumbnail} />
        <span>{this.props.photo.title}</span>
      </li>;
    }
  });
});
