import React, { Component } from "react";

import history from "../../../root/root.history";

import { resetSearch } from "./../../../helpers/get-data";

import "./custom-select.css";

const SEARCH_OPTIONS = [
  "All",
  "Boardings",
  "Vessels",
  "Crew",
  "Users",
  "Agencies",
  "Reports",
];

class CustomSelect extends Component {
  state = {
    selected: "",
    showOptionsList: false,
  };

  setSelected = (option) => {
    const currentPath = history.location.pathname;
    const newPath = option === "All" ? "home" : option.toLowerCase();

    if (`/${newPath}` !== currentPath) {
      history.replace(`/${newPath}`);
    }
    resetSearch();

    this.setState({ selected: option });
  };

  componentDidMount() {
    const currentLocation = history.location.pathname.match(/[a-zA-Z]+/g)[0];
    this.setState({
      selected: currentLocation === "home" ? "All" : currentLocation,
    });
  }

  render() {
    const { selected, showOptionsList } = this.state;

    return (
      <div className="flex-row relative select-menu">
        <div
          className="flex-row align-center justify-between full-view selected-item"
          onClick={() => this.setState({ showOptionsList: !showOptionsList })}
        >
          <div className="capitalize">{selected}</div>
          <div>&#11206;</div>
        </div>
        {showOptionsList && (
          <div className="flex-column white-bg box-shadow absolute options-list">
            {SEARCH_OPTIONS.map((option, key) => (
              <div
                className="option"
                key={key}
                onClick={() => this.setSelected(option)}
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}

export default CustomSelect;
