'use strict';

const btnByDist = document.querySelector('#btn-by-dist');
const btnByPIN = document.querySelector('#btn-by-pin');
const divDistrict = document.querySelector('#search-by-district');
const divPinCode = document.querySelector('#search-by-pincode');
const stateDropdown = document.querySelector('#states-name');
const districtDropdown = document.querySelector('#district-name');
const chooseDate = document.querySelector('#choose-date');
const btnCheckBasedOnDistrict = document.querySelector('#btn-check-district');
const txtPinCode = document.querySelector('#pin-code');
const chooseDatePin = document.querySelector('#choose-date-pin');
const btnCheckBasedOnPin = document.querySelector('#btn-check-pin');
const outputMessage = document.querySelector('#output');
const tableData = document.querySelector('#tbl-response');

const covinAPI = {
  stateListAPI: 'https://cdn-api.co-vin.in/api/v2/admin/location/states',
  districtListAPI: 'https://cdn-api.co-vin.in/api/v2/admin/location/districts/',
  calenderByDistrict:
    'https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict',
  calenderByPin:
    'https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByPin',
};

const selectedValuesBasedonDistrict = {
  stateCode: '',
  districtCode: '',
  selectedDate: '',
};

const selectedValuesBasedonPin = {
  pinCode: '',
  selectedDate: '',
};

const eventHandler = () => {
  displayMessage(
    'An error occured in fetching the data. Sorry for the inconvenience'
  );
};

const listStates = () => {
  fetch(covinAPI.stateListAPI)
    .then(response => response.json())
    .then(json => {
      let listOfStates = "<option selected value='0'>Select</option>";
      for (const state of json.states) {
        listOfStates =
          listOfStates +
          `<option value='${state.state_id}'>${state.state_name}</option>`;
      }
      stateDropdown.innerHTML = listOfStates;
      districtDropdown.innerHTML = "<option selected value='0'>Select</option>";
    })
    .catch(eventHandler);
};

const listDistricts = stateID => {
  let listOfDistricts = "<option selected value='0'>Select</option>";
  districtDropdown.innerHTML = listOfDistricts;
  if (stateID !== '0') {
    fetch(covinAPI.districtListAPI + stateID)
      .then(response => response.json())
      .then(json => {
        for (const district of json.districts) {
          listOfDistricts =
            listOfDistricts +
            `<option value='${district.district_id}'>${district.district_name}</option>`;
        }
        districtDropdown.innerHTML = listOfDistricts;
      })
      .catch(eventHandler);
  }
  districtDropdown.innerHTML = listOfDistricts;
};

const displayMessage = message => {
  outputMessage.innerText = message;
};

const validateFields = () => {
  if (
    selectedValuesBasedonDistrict.stateCode === '' ||
    selectedValuesBasedonDistrict.stateCode === '0'
  ) {
    displayMessage('Choose the State');
    return false;
  }
  if (
    selectedValuesBasedonDistrict.districtCode === '' ||
    selectedValuesBasedonDistrict.districtCode === '0'
  ) {
    displayMessage('Choose the District');
    return false;
  }
  return true;
};

const validateFieldsPin = () => {
  if (
    selectedValuesBasedonPin.pinCode === '' ||
    selectedValuesBasedonPin.pinCode.length !== 6
  ) {
    displayMessage('Please enter a valid Pin Code');
    return false;
  }
  return true;
};

const listSlotsByDistrict = () => {
  fetch(
    covinAPI.calenderByDistrict +
      '?district_id=' +
      selectedValuesBasedonDistrict.districtCode +
      '&date=' +
      selectedValuesBasedonDistrict.selectedDate
  )
    .then(response => response.json())
    .then(json => displayCentersAsTable(json, selectedValuesBasedonDistrict))
    .catch(eventHandler);
};

const listSlotsByPin = () => {
  fetch(
    covinAPI.calenderByPin +
      '?pincode=' +
      selectedValuesBasedonPin.pinCode +
      '&date=' +
      selectedValuesBasedonPin.selectedDate
  )
    .then(response => response.json())
    .then(json => displayCentersAsTable(json, selectedValuesBasedonPin))
    .catch(eventHandler);
};

const getNextSevenDays = dataObj => {
  let dateHead = [];
  for (let i = 0; i < 7; i++) {
    let dateSplit = dataObj.selectedDate.split('-');
    dateHead.push(
      new Date(dateSplit[2], +dateSplit[1] - 1, +dateSplit[0] + i)
        .toLocaleDateString('en-GB')
        .split('/')
        .join('-')
    );
  }
  return dateHead;
};

const createAvailabiltyColumn = (center, dateShown) => {
  const feeType = center.fee_type;
  let vaccineType = '';
  let vaccineFee = '';
  let minAgeLimit = '';
  let maxAgeLimit = '';
  let allowAllAge = '';
  let availableDose1 = '';
  let availableDose2 = '';
  let htmlColumn = '<td>';
  for (const session of center.sessions) {
    if (session.date === dateShown) {
      vaccineType = session.vaccine;
      allowAllAge = session.allow_all_age;
      availableDose1 = session.available_capacity_dose1;
      availableDose2 = session.available_capacity_dose2;
      if (!allowAllAge) {
        minAgeLimit = session.min_age_limit;
        maxAgeLimit = session?.max_age_limit ?? '';
      } else {
        minAgeLimit = session.min_age_limit;
      }
      if (feeType === 'Paid') {
        for (const fees of center.vaccine_fees) {
          if (fees.vaccine === vaccineType) {
            vaccineFee = fees.fee;
          }
        }
      } else {
        vaccineFee = 'Free';
      }
      htmlColumn =
        htmlColumn +
        `<div class='vaccine-container'><div class='vaccine-type'>${vaccineType} <span class='age-limit'>(${minAgeLimit}${
          maxAgeLimit !== '' ? ' - ' + maxAgeLimit : '+'
        })</span></div>
        <div class='div-dose-count'><span class='dose-count'>Dose 1: <span class='dose-one'>${availableDose1}</span><br/> Dose 2: <span class='dose-two'>${availableDose2}</span></span></div>
        <div class='div-fees'>Fees: <span class='fees-amount'>${vaccineFee}</span></div>
        </div>`;
    }
  }
  htmlColumn = htmlColumn + '</td>';
  return htmlColumn;
};

const displayCentersAsTable = (responseObj, dataObj) => {
  if (responseObj.centers.length === 0) {
    displayMessage('No Centers Available');
    tableData.innerHTML = '';
    tableData.style.display = 'none';
    return;
  }
  let htmlContent = `<tr><th>Center</th>`;
  for (const dateShown of getNextSevenDays(dataObj)) {
    htmlContent = htmlContent + `<th>${dateShown}</th>`;
  }
  htmlContent = htmlContent + '</tr>';
  for (const center of responseObj.centers) {
    htmlContent =
      htmlContent +
      `<tr><th><div class='center-name'>${center.name}</div>
      <div class='fees-type'>${center.fee_type}</div></th>`;
    for (const dateShown of getNextSevenDays(dataObj)) {
      htmlContent = htmlContent + createAvailabiltyColumn(center, dateShown);
    }
    htmlContent = htmlContent + `</tr>`;
  }
  tableData.innerHTML = htmlContent;
};

const selectChoosedDate = dateElement => {
  let dateVal;
  if (dateElement.value === '') {
    dateVal = new Date();
  } else {
    dateVal = new Date(dateElement.value);
  }
  return dateVal.toLocaleDateString('en-GB').split('/').join('-');
};

stateDropdown.addEventListener('change', event => {
  selectedValuesBasedonDistrict.stateCode = event.target.value;
  selectedValuesBasedonDistrict.districtCode = '';
  listDistricts(selectedValuesBasedonDistrict.stateCode);
});

districtDropdown.addEventListener('change', event => {
  selectedValuesBasedonDistrict.districtCode = event.target.value;
});

btnCheckBasedOnDistrict.addEventListener('click', () => {
  displayMessage('');
  tableData.style.display = 'none';
  selectedValuesBasedonDistrict.selectedDate = selectChoosedDate(chooseDate);
  if (validateFields()) {
    tableData.style.display = 'block';
    listSlotsByDistrict();
  }
});

btnCheckBasedOnPin.addEventListener('click', () => {
  displayMessage('');
  tableData.style.display = 'none';
  selectedValuesBasedonPin.selectedDate = selectChoosedDate(chooseDatePin);
  selectedValuesBasedonPin.pinCode = txtPinCode.value;
  if (validateFieldsPin()) {
    tableData.style.display = 'block';
    listSlotsByPin();
  }
});

btnByDist.addEventListener('click', () => {
  mainFunction('flex', 'none', btnByDist, btnByPIN);
});

btnByPIN.addEventListener('click', () => {
  mainFunction('none', 'flex', btnByPIN, btnByDist);
});

const mainFunction = (
  dispValueOne,
  dispValueTwo,
  btnElementOne,
  btnElementTwo
) => {
  divDistrict.style.display = dispValueOne;
  divPinCode.style.display = dispValueTwo;
  btnElementOne.classList.add('active');
  btnElementTwo.classList.remove('active');
  selectedValuesBasedonDistrict.stateCode = '';
  selectedValuesBasedonDistrict.districtCode = '';
  selectedValuesBasedonDistrict.selectedDate = '';
  selectedValuesBasedonPin.pinCode = '';
  selectedValuesBasedonPin.selectedDate = '';
  if (dispValueOne === 'flex' && dispValueTwo === 'none') {
    listStates();
  }
  chooseDate.value = '';
  txtPinCode.value = '';
  chooseDatePin.value = '';
  displayMessage('');
  tableData.innerHTML = '';
};

mainFunction('flex', 'none', btnByDist, btnByPIN);
