import React, { Component, Fragment } from "react";
import moment from "moment";
import Pagination from "@material-ui/lab/Pagination";
import Highlighter from "react-highlight-words";

import { getColor, getHighlightedText } from "./../../helpers/get-data";

import SearchPanel from "./../partials/search-panel/search-panel.component";
import FilterPanel from "./../partials/filter-panel/filter-panel.component";
import LoadingPanel from "./../partials/loading-panel/loading-panel.component";

import SearchService from "./../../services/search.service";
import StitchService from "./../../services/stitch.service";

import "./crew.css";

const searchService = SearchService.getInstance();
const stitchService = StitchService.getInstance();

const filterConfiguration = {
  Risk: [
    {
      name: "safetyLevel.red",
      field: "inspection.summary.safetyLevel",
      value: "Red",
      title: "Red",
      partTitle: "Risk: Red",
      type: "risk",
    },
    {
      name: "safetyLevel.amber",
      field: "inspection.summary.safetyLevel",
      value: "Amber",
      title: "Amber",
      partTitle: "Risk: Amber",
      type: "risk",
    },
    {
      name: "safetyLevel.green",
      field: "inspection.summary.safetyLevel",
      value: "Green",
      title: "Green",
      partTitle: "Risk: Green",
      type: "risk",
    },
  ],
  "Boarding Information": [
    {
      name: "date",
      title: "Date",
      type: "date",
    },
    {
      name: "date-from",
      title: "Date from",
      type: "date",
    },
    {
      name: "date-to",
      title: "Date To",
      type: "date",
    },
    {
      name: "time",
      field: "date",
      title: "Time",
      type: "time",
    },
    {
      name: "location",
      title: "Location",
      type: "location",
    },
  ],
  "Vessel Information": [
    {
      name: "vessel.permitNumber",
      title: "Permit Number",
      type: "string-equal",
    },
    {
      name: "vessel.nationality",
      title: "Nationality",
    },
  ],
};

class Crew extends Component {
  state = {
    crew: [],
    total: 0,
    activePage: 10,
    limit: 50,
    offset: 0,
    searchQuery:
      searchService.searchResults && searchService.searchResults.query
        ? searchService.searchResults.query
        : "",
    highlighted: [],
    loading: false,
    currentFilter: null,
    page: 1,
  };

  search = (value) => {
    if (searchService.searchResults && searchService.searchResults.query) {
      searchService.searchResults.query = value;
    }
    this.loadData({ searchQuery: value, offset: 0 });
  };

  handlePageChange = (e, page) => {
    const { limit } = this.state;
    const newOffset = (page - 1) * limit;
    this.loadData({
      offset: newOffset,
      page: page,
    });
  };

  handleFilterChanged = (value) => {
    this.loadData({
      currentFilter: value,
    });
  };

  componentDidMount() {
    this.loadData();
  }

  prepareSearchResultData(data) {
    const allCrew = [];

    data.forEach((crewMember) => {
      crewMember.highlights.forEach((el) => {
        if (el.path.includes("captain")) {
          const addedCrew = allCrew.find((item) => {
            return (
              item.license === crewMember.captain.license &&
              item.vessel === crewMember.vessel &&
              item.safetyLevel === crewMember.safetyLevel
            );
          });
          if (addedCrew) {
            addedCrew.violations += crewMember.violations;
            if (addedCrew.date < crewMember.date) {
              addedCrew.date = crewMember.date;
            }
          } else {
            allCrew.push({
              name: crewMember.captain.name,
              rank: "captain",
              vessel: crewMember.vessel,
              license: crewMember.captain.license,
              violations: crewMember.violations,
              date: crewMember.date,
              safetyLevel: crewMember.safetyLevel,
            });
          }
        } else {
          crewMember.crew.forEach((member) => {
            const addedCrew = allCrew.find((item) => {
              return (
                item.license === member.license &&
                item.vessel === crewMember.vessel &&
                item.safetyLevel === crewMember.safetyLevel
              );
            });
            const foundCrewMember = el.texts.find((item) => {
              if (item.type === "hit") {
                return item.value;
              }
              return null;
            }).value;

            if (member.name.includes(foundCrewMember)) {
              if (addedCrew) {
                addedCrew.violations += crewMember.violations;
                if (addedCrew.date < crewMember.date) {
                  addedCrew.date = crewMember.date;
                }
              } else {
                allCrew.push({
                  name: member.name,
                  rank: "crew",
                  vessel: crewMember.vessel,
                  license: member.license,
                  violations: crewMember.violations,
                  date: crewMember.date,
                  safetyLevel: crewMember.safetyLevel,
                });
              }
            }
          });
        }
      });
    });
    return allCrew.sort(
      (a, b) =>
        (a.name === b.name ? 0 : a.name < b.name ? -1 : 1) +
        (a.vessel === b.vessel ? 0 : a.vessel < b.vessel ? -1 : 1) / 10
    );
  }

  loadData(newState) {
    newState = newState ? newState : {};
    newState.loading = true;
    this.setState(newState, () => {
      const { limit, offset, searchQuery, currentFilter } = this.state;

      stitchService
        .getCrewsWithFacet(limit, offset, searchQuery, currentFilter)
        .then((data) => {
          const dataSource = searchQuery
            ? this.prepareSearchResultData(data.crew)
            : data.crew;
          this.setState({
            loading: false,
            crew: dataSource,
            total: searchQuery ? dataSource.length : data.amount || 0,
            highlighted:
              searchQuery || data.highlights
                ? getHighlightedText(data.highlights || [])
                : [],
          });
        })
        .catch((error) => {
          console.error(error);
        });
    });
  }

  render() {
    const {
      crew,
      total,
      limit,
      loading,
      highlighted,
      searchQuery,
      page,
    } = this.state;

    return (
      <div className="padding-bottom flex-column align-center">
        <SearchPanel handler={this.search} value={searchQuery} />
        <div className="flex-row justify-between standard-view">
          <div className="items-amount">
            {loading ? "Loading..." : `${total} Crew Members`}
          </div>
          <FilterPanel
            options={{ searchByFilter: true }}
            configuration={filterConfiguration}
            onFilterChanged={this.handleFilterChanged}
          ></FilterPanel>
        </div>
        {crew && crew.length && !loading ? (
          <Fragment>
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr className="table-row row-head">
                    <td>Name</td>
                    <td>Lisence number</td>
                    <td>Vessel</td>
                    <td>Violations</td>
                    <td>Last boarded</td>
                  </tr>
                </thead>
                <tbody>
                  {crew.map((item, ind) => (
                    <tr className="table-row row-body" key={ind}>
                      <td>
                        <div className="flex-row align-center">
                          <div className="crew-name">
                            <Highlighter
                              highlightClassName="highlighted"
                              searchWords={highlighted}
                              autoEscape={true}
                              textToHighlight={item.name}
                            />
                          </div>
                          {item.rank === "captain" && (
                            <div className="captain-icon">CAPTAIN</div>
                          )}
                        </div>
                      </td>
                      <td>{item.license}</td>
                      <td>{item.vessel}</td>
                      <td>
                        {item && item.violations
                          ? item.violations
                          : "No violations"}
                      </td>
                      <td>
                        <div className="flex-row">
                          <div className="delivery-date">
                            {moment(item.date).format("LLL")}
                          </div>
                          <div
                            className="risk-icon"
                            style={{
                              background: `${getColor(
                                (item.safetyLevel && item.safetyLevel.level
                                  ? item.safetyLevel.level.toLowerCase()
                                  : item.safetyLevel
                                ).toLowerCase()
                              )}`,
                            }}
                          ></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {total > limit && (
              <Pagination
                page={page}
                count={Math.ceil(total / limit)}
                shape="rounded"
                onChange={this.handlePageChange}
              />
            )}
          </Fragment>
        ) : loading ? (
          <LoadingPanel></LoadingPanel>
        ) : (
          "No crew members found"
        )}
      </div>
    );
  }
}

export default Crew;
