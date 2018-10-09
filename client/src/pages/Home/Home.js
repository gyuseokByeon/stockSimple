import React, { Component } from 'react';
import Authorize from '../../utils/Authorize';
import ArticleFunction from '../../utils/ArticleData';
import Investment from '../../utils/InvestmentData';
import WatchlistAdd from '../../utils/Watchlists';
import './Home.css';
import MainNavbar from '../../components/Navbar';
import ModalPage from '../../components/SideApiResult';
import Article from '../../components/Article';
import InvestAccordion from '../../components/InvestAccordion';
import WatchlistTab from '../../components/WatchlistTabs';
import { Row, Col, Button } from 'mdbreact';
import swal from 'sweetalert';
import moment from 'moment';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'mdbreact';

class Home extends Component {

  constructor(props) {
    super(props);
    this.deleteArticle = this.deleteArticle.bind(this);
    this.handleArticleFilter = this.handleArticleFilter.bind(this);
    this.addInvestmentVal = this.addInvestmentVal.bind(this);
    this.addStockInvestment = this.addStockInvestment.bind(this);
    this.deleteInvestment = this.deleteInvestment.bind(this);
    this.getAllUserData = this.getAllUserData.bind(this);
    this.getInvestmentTotals = this.getInvestmentTotals.bind(this);
    this.addFullWatchlist = this.addFullWatchlist.bind(this);
    this.addWatchlistVal = this.addWatchlistVal.bind(this);
    this.deleteWatchlist = this.deleteWatchlist.bind(this);
    this.state = {
      isLoading: true,
      username: "",
      collapse: false,
      isWideEnough: false,
      modal6: false,
      modal7: false,
      savedArticles: [],
      savedArticlesFilter: [],
      investments: [],
      watchlists: [],
      addStockName: "",
      addStockTicker: "",
      addStockShares: "",
      addStockPrice: "",
      addWatchlistName: "",
      date: moment().format("DD-MM-YYYY"),
    };
  }

  // when the page loads grab the token and userID from local storage
  // pass it into authenticate function. If server responds ok, then load data
  // if not then push to login screen
  componentDidMount() {
    this.getAllUserData('all');
  }

  // gets the user data, returns specific data based on parameter passed in
  getAllUserData(update) {
    let userAuthInfo = {
      token: localStorage.getItem('jwtToken'),
      userID: localStorage.getItem('userID')
    }
    switch (update) {
      case 'all':
        Authorize.authenticate(userAuthInfo)
          .then((res) => {
            this.setState({
              username: res.data.name,
              savedArticles: res.data.articles,
              savedArticlesFilter: res.data.articles,
              investments: res.data.investments,
              watchlists: res.data.watchlists
            })
          })
          .then(() => {
            this.setState({
              isLoading: false
            })
            this.getInvestmentTotals();
          })
          .catch((error) => {
            if (error.response.status === 401) {
              this.props.history.push("/login");
            }
          });
        break;
      case 'investments':
        Authorize.authenticate(userAuthInfo)
          .then((res) => {
            this.setState({
              investments: res.data.investments
            })
          })
          .catch((error) => {
            swal({
              title: "Error. Please refresh page",
              icon: "error",
              dangerMode: true,
            })
          });
        break;
      case 'watchlists':
        Authorize.authenticate(userAuthInfo)
          .then((res) => {
            this.setState({
              watchlists: res.data.watchlists
            })
          })
          .catch((error) => {
            swal({
              title: "Error. Please refresh page",
              icon: "error",
              dangerMode: true,
            })
          });
        break;
    }
  }

  // clear the web token and email from local storage when the user logs out
  logout = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userID');
    window.location.reload();
  }

  // grab theindex of the article clicked and pass it into delete function
  // if the server responds with success than display a message (swal) and remove the element from the state
  // Article function imported from 'utils' which hits back end sraping route
  deleteArticle = index => {
    let { _id } = this.state.savedArticles[index];
    ArticleFunction.deleteArticle(_id)
      .then((response) => {
        if (response.data.success) {

          let { savedArticles } = this.state;
          savedArticles = savedArticles.slice(0, index).concat(savedArticles.slice(index + 1));
          this.setState({
            savedArticlesFilter: savedArticles,
            savedArticles: savedArticles
          });
          swal({
            title: "Article Deleted!",
            icon: "error",
            dangerMode: true,
          })
        } else {
          swal({
            title: "Could not delete, please try again",
            icon: "error",
            dangerMode: true,
          })
        }
      })
  }

  //  parses the article search bar and filters articles that match
  handleArticleFilter(e) {
    const condition = new RegExp(e.target.value, 'i');
    const savedArticlesFilter = this.state.savedArticles.filter(name => {
      return condition.test(name.title);
    });
    this.setState({
      savedArticlesFilter
    })
  }


  // function to toggle the side result
  toggle(nr) {
    let modalNumber = 'modal' + nr
    this.setState({
      [modalNumber]: !this.state[modalNumber]
    });
  }

  // sets the state to the values of the inputs being used to add stocks
  addInvestmentVal = (e) => {
    const state = this.state
    state[e.target.name] = e.target.value;
    this.setState(state);
  }

  addWatchlistVal = (e) => {
    const state = this.state
    state[e.target.name] = e.target.value;
    this.setState(state);
  }

  addFullWatchlist = (e) => {
    let userId = localStorage.getItem('userID'); 
    let { addWatchlistName } = this.state
    if (addWatchlistName) {
      WatchlistAdd.addFullWatchlist({addWatchlistName, userId})
      .then ((res) => {
        swal("Watchlist added", "Remember to watch for market changes", "success");
        this.getAllUserData('watchlists')
      })
    } else {
      swal({
        title: "Cannot add empty value",
        icon: "error",
        dangerMode: true,
      })
    }
  }

  deleteWatchlist = (e) => {
    console.log(e.target.name); 
  }

  // function to add a stock to users portfolio
  addStockInvestment = (e) => {
    let { addStockName, addStockPrice, addStockShares, addStockTicker, date } = this.state;
    let userID = localStorage.getItem('userID');
    if (!addStockName || !addStockPrice || !addStockShares || !addStockTicker) {
      swal({
        title: "You must fill all fields",
        icon: "error",
        dangerMode: true,
      })
    } else if (!parseInt(addStockPrice) || !parseInt(addStockShares)) {
      swal({
        title: "Shares purchased and price must be numbers",
        icon: "error",
        dangerMode: true,
      })
    } else {
      let stockAdded = { addStockName, addStockPrice, addStockShares, addStockTicker, userID, date }
      Investment.addStock(stockAdded)
        .then((result) => {
          if (result.data.success) {
            swal("Stock added", "Best of luck", "success");
            this.getAllUserData('investments')
          }
        })
    }
  }

  // deletes a stock from the users investment portfolio
  deleteInvestment = (e) => {
    Investment.deleteStock(e.target.name)
      .then((result) => {
        if (result.data.success) {
          swal("Investment deleted", "Sorry it didnt work out", "success");
          this.getAllUserData('investments')
        }
      })
  }

  getInvestmentTotals = (e) => {
    let investedMoney = [];
    let moneyMade = [];
    let singleStockVal = [];
    this.state.investments.forEach((investment) => {
      if (investment.currentPrice) {
        let name = investment.name;
        let startingVal = investment.sharesPurchased * investment.pricePurchased;
        let currentVal = investment.sharesPurchased * investment.currentPrice;
        let singleStock = { name, startingVal, currentVal };
        singleStockVal.push(singleStock);
        investedMoney.push(investment.sharesPurchased * investment.pricePurchased);
        moneyMade.push(investment.sharesPurchased * investment.currentPrice);
      }
    })
    console.log(singleStockVal)
    console.log(investedMoney)
    console.log(moneyMade)
  }


  render() {
    return (
      <div className="home-div">
        <Button onClick={() => this.toggle(8)} className="home-article-btn p-2"></Button>
        <MainNavbar
          pageName={'Stock Simple'}
          logout={localStorage.getItem('jwtToken') && this.logout}
          username={this.state.username}
          pageSwitchName='Go to Search'
          pageSwitchLink='/search'
        />
        {/* Modal that toggles and displays all saved articles */}
        <ModalPage
          modal8={this.state.modal8}
          toggleClick={() => this.toggle(8)}
          toggleView={() => this.toggle(8)}
          title={'Saved Articles'}
        >
          {/* after importing 'Article' element, map the saved articles in the state and make an article for each one */}

          <div>
            <input
              className="search w-100 m-2"
              placeholder="Filter results by name"
              onChange={this.handleArticleFilter}
            />
            {this.state.savedArticles.length ? (
              <Row className="justify-content-center bg-dark h-100">
                {this.state.savedArticlesFilter.map((article, index) => (
                  <Article
                    key={index}
                    imgLink={article.imgLink}
                    title={article.title}
                    desc={article.desc}
                    action={'Delete'}
                    // site uses relative url so need to interpolate full url for link to work
                    link={`https://www.investopedia.com/${article.link}`}
                    date={article.date}
                    actionBtn={() => this.deleteArticle(index)}
                    className="mx-auto bg-dark"
                  >
                  </Article>
                ))}
              </Row>
            ) : (
                <h4 className="content-font text-white text-center">No Articles Saved</h4>
              )}
          </div>
        </ModalPage>

        {/* ternary that covers all visible components. if 'this.state.isLoading' is true than the waiting icon shows */}
        {!this.state.isLoading ? (
          <Row className="w-100 m-0 justify-content-center">
            <Col md="6" className="investments-col p-2">
              <div className="d-flex justify-content-between">
                <h4 className="content-font turq-text ml-3 d-inline">Watchlists</h4>
                <Dropdown size="sm">
                  <DropdownToggle caret id="add-stock-drop">
                    Add Watchlist
                    </DropdownToggle>
                  <DropdownMenu className="mr-5">
                    <ul className="list-unstyled p-2 mb-0">
                      <li>
                        <input
                          name="addWatchlistName"
                          className="search w-100 mb-2 p-2 border-rounded"
                          placeholder="Name"
                          onChange={this.addWatchlistVal}
                        />
                      </li>
                    </ul>
                    <DropdownItem divider />
                    <DropdownItem
                      className="content-font p-2 drop-down-btn"
                      onClick={this.addFullWatchlist}
                    >
                      Add a watchlist
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
              <WatchlistTab
                watchlists={this.state.watchlists}
                deleteWatchlist = {this.deleteWatchlist}
              />
            </Col>
            <Col md="6" className="p-2">
              <div className="d-flex justify-content-between">
                <h4 className="content-font turq-text ml-3 d-inline">Investments</h4>
                <Dropdown size="sm" className="mr-3">
                  <DropdownToggle caret id="add-stock-drop">
                    Add Stock
                    </DropdownToggle>
                  <DropdownMenu className="mr-5">
                    <ul className="list-unstyled p-2 mb-0">
                      <li>
                        <input
                          name="addStockName"
                          className="search w-100 mb-2 p-2 border-rounded"
                          placeholder="Name"
                          onChange={this.addInvestmentVal}
                        />
                      </li>
                      <li>
                        <input
                          name="addStockTicker"
                          className="search w-100 mb-2 p-2 border-rounded"
                          placeholder="Stock ticker"
                          onChange={this.addInvestmentVal}
                        />
                      </li>
                      <li>
                        <input
                          name="addStockShares"
                          className="search w-100 mb-2 p-2 border-rounded"
                          placeholder="# of shares"
                          onChange={this.addInvestmentVal}
                        />
                      </li>
                      <li>
                        <input
                          name="addStockPrice"
                          className="search w-100 mb-2 p-2 border-rounded"
                          placeholder="Price"
                          onChange={this.addInvestmentVal}
                        />
                      </li>
                    </ul>
                    <DropdownItem divider />
                    <DropdownItem
                      className="content-font p-2 drop-down-btn"
                      onClick={this.addStockInvestment}
                    >
                      Add to investments
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>

              {/* Investment accordion component */}
              <InvestAccordion
                investments={this.state.investments}
                deleteInvestment={this.deleteInvestment}
              >
              </InvestAccordion>
            </Col>
          </Row>
        ) : (
            <div className="loading">
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
            </div>
          )}
      </div>
    );
  }
}


export default Home;
