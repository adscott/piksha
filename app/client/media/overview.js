n('piksha.media', function (ns) {
  ns.Overview = React.createClass({
    getInitialState: function () {
      return {album: ''};
    },
    showAlbum: function (url) {
      this.setState({album: url});
    },
    showAlbums: function () {
      this.setState({album: ''});
    },
    render: function () {
      if (this.state.album) {
        return <piksha.media.Album album={this.state.album} showAlbums={this.showAlbums} />;
      } else {
        return <div>
            <piksha.application.Greeting />
            <piksha.media.AlbumsList albumChosen={this.showAlbum} />
          </div>;
      }
    }
  });
});
