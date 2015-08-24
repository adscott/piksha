n('piksha.media', function (ns) {
  ns.Photo = React.createClass({
    getInitialState: function () {
      return {photo: null, previousUrl: '', nextUrl: ''};
    },
    componentDidMount: function () {
      var self = this;
      var mediaService = piksha.media.MediaService.create();

      mediaService.asset(this.props.photoUrl).then(function (photo) {
        self.setState({photo: photo});
      });

      mediaService.asset(this.props.albumUrl).then(function (album) {
        var photos = album.photos;
        var index = _.findIndex(photos, function (photo) { return self.props.photoUrl === photo.url; });
        var previousIndex = (index - 1) < 0 ? photos.length - 1 : index - 1;
        var nextIndex = (index + 1) === photos.length ? 0 : index + 1;
        self.setState({previousUrl: photos[previousIndex].url, nextUrl: photos[nextIndex].url});
      });
    },
    showAlbum: function (e) {
      e.preventDefault();
      piksha.application.Router.instance().changeRoute('album', {albumUrl: this.props.albumUrl});
    },
    showPrevious: function (e) {
      e.preventDefault();
      piksha.application.Router.instance().changeRoute('photo', {photoUrl: this.state.previousUrl, albumUrl: this.props.albumUrl});
    },
    showNext: function (e) {
      e.preventDefault();
      piksha.application.Router.instance().changeRoute('photo', {photoUrl: this.state.nextUrl, albumUrl: this.props.albumUrl});
    },
    render: function () {
      if (this.state.photo && this.state.previousUrl && this.state.nextUrl) {
        return <div>
            <nav>
              <a href="#" onClick={this.showAlbum}>Back</a>
              <a href="#" onClick={this.showPrevious}>Previous</a>
              <a href="#" onClick={this.showNext}>Next</a>
            </nav>
            <div className="main">
              <img src={this.state.photo.full} />
            </div>
            <h3 className="caption">{this.state.photo.title}</h3>
          </div>;
      } else {
        return <piksha.application.Loading />;
      }
    }
  });
});
