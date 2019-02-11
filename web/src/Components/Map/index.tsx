import * as React from "react";
import { MAP } from "../../Constants/constants";

/* Components */
import GoogleMapReact from "google-map-react";
import { EventPin } from "./EventPin";
import { MapActions } from "./MapActions";
import LinearProgress from "@material-ui/core/LinearProgress";
import { Event } from "../../modules/Event";

/* Dialogs */
import SearchDialog from "../../Dialogs/SearchDialog";
import CreateEventDialog from "../../Dialogs/CreateEventDialog";

/* Services */
import EventService from "../../Services/Event/event.service";
import AccountService from "../../Services/Account/account.service";

const API_KEY: any = process.env.REACT_APP_GOOGLE_MAPS_KEY;

// First we get the viewport height and we multiple it by 1% to get a value for a vh unit
let vh = window.innerHeight * 0.01;
// Then we set the value in the --vh custom property to the root of the document
document.documentElement.style.setProperty("--vh", `${vh}px`);

// We listen to the resize event
window.addEventListener("resize", () => {
  // We execute the same script as before
  let vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
});

interface State {
  readonly eventPins: Array<any>;
  readonly center: any;
  readonly zoom: number;
  readonly searchOpen: boolean;
  readonly createEventOpen: boolean;
  readonly loading: boolean;
}

export class Map extends React.Component<any, State> {
  readonly state: State;
  mapOptions: any;

  constructor(props: any) {
    super(props);

    this.state = {
      eventPins: [],
      center: MAP.default_location,
      zoom: 12,
      searchOpen: false,
      createEventOpen: false,
      loading: false
    };

    this.mapOptions = {
      disableDefaultUI: true,
      gestureHandling: "greedy",
      enableHighAccuracy: true
    }

    this.onMapChange = this.onMapChange.bind(this);
    this.isLoading = this.isLoading.bind(this);
    this.getEventPins = this.getEventPins.bind(this);
    this.setEventPins = this.setEventPins.bind(this);
    this.onCreateEventOpen = this.onCreateEventOpen.bind(this);
    this.onCreateEventClose = this.onCreateEventClose.bind(this);
    this.getMyLocation = this.getMyLocation.bind(this);
    this.onSearchOpen = this.onSearchOpen.bind(this);
    this.onSearchClose = this.onSearchClose.bind(this);
    this.onSearch = this.onSearch.bind(this);
  }

  /* LIFE CYCLE */
  componentDidMount() {
    this.getEventPins();
  }

  isLoading() {
    if (this.state.loading) {
      return (
        <div className="loading-bar-container">
          <LinearProgress className="loading-bar" color="primary" />
        </div>
      );
    } else {
      return null;
    }
  }

  /* LOCATION */
  onMapChange(properties: any) {
    this.setState({ center: properties.center, zoom: properties.zoom });
  }

  getMyLocation() {
    this.setState({ loading: true });
    const location = window.navigator && window.navigator.geolocation;
    let myLocation;

    if (location) {
      location.getCurrentPosition(
        position => {
          myLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          this.setState({ center: myLocation, loading: false, zoom: 14 });
        },
        error => {
          this.setState({ loading: false });
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      );
    }
  }

  /* EVENTS */
  async getEventPins() {
    let events = await EventService.getAll();
    await Promise.all(
      events.map(async (event: Event) => {
        let account = await AccountService.getById(event._id);
        event.user = account.name;
      })
    );

    this.setEventPins(events);
  }

  setEventPins(events: Array<Event>) {
    let eventPins = events.map((event: Event) => {
      return (
        <EventPin
          key={event._id}
          lat={event.lat}
          lng={event.lng}
          event={event}
        />
      );
    });
    this.setState({ eventPins: eventPins });
  }

  onCreateEventOpen() {
    this.setState({ createEventOpen: true });
  }

  onCreateEventClose() {
    this.setState({ createEventOpen: false });
  }

  /* SEARCH */
  onSearchOpen() {
    this.setState({ searchOpen: true });
  }

  onSearchClose() {
    this.setState({ searchOpen: false });
  }

  onSearch(data: any) {
    if (!data || !data.length) return;

    let _center = {
      lat: data[0].geometry.location.lat(),
      lng: data[0].geometry.location.lng()
    };

    this.setState({ center: _center, zoom: 14, searchOpen: false });
  }

  render() {
    return (
      <div className="map">
        {this.isLoading()}
        <MapActions
          onSearchOpen={this.onSearchOpen}
          getMyLocation={this.getMyLocation}
          onCreateEventOpen={this.onCreateEventOpen}
        />
        <SearchDialog
          open={this.state.searchOpen}
          onClose={this.onSearchClose}
          search={this.onSearch}
        />
        <CreateEventDialog
          open={this.state.createEventOpen}
          addEvent={this.getEventPins}
          onClose={this.onCreateEventClose}
        />
        {/* @ts-ignore */}
        <GoogleMapReact
          ref="map"
          bootstrapURLKeys={{ key: API_KEY }}
          defaultCenter={{
            lat: 43.079,
            lng: -89.386408
          }}
          center={this.state.center}
          zoom={this.state.zoom}
          defaultZoom={11}
          onChange={this.onMapChange}
          options={this.mapOptions}
        >
          {this.state.eventPins}
        </GoogleMapReact>
      </div>
    );
  }
}