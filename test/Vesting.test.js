const Vesting = artifacts.require("./Vesting");
const MyToken = artifacts.require("./MyToken");

const {
  ether,           // Big Number support
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert,
  balance,
  time, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

const { expect } = require("chai");
const BN = Web3.utils.BN;

contract("Vesting", async ([owner, acc2, acc3, acc4]) => {

  let instanceToken;
  let instanceVesting;

  before(async () => {
    instanceToken = await MyToken.new();
    instanceVesting = await Vesting.new(instanceToken.address);
  });

  describe("Deploy Vesting contract - false", async () => {
    it("Error : Incorrect address , only contract address", async () => {
      await expectRevert(Vesting.new(acc2), "Error : Incorrect address , only contract address");
    });
  });

  describe("Rigth initialization", async () => {
    it("check owner balance - result 100000 tokens", async () => {
      let balance = await instanceToken.balanceOf(owner);
      expect(balance.toString()).to.be.equal(Web3.utils.toWei("100000", "ether"));
    });
  });

  describe("setInitialTimestamp function", async () => {

    describe("setInitialTimestamp function - false", async () => {
      it("setInitialTimestamp - caller is not the owner", async () => {
        let vestingStartDateBefore = await instanceVesting.vestingStartDate.call();
        expect(vestingStartDateBefore.toString()).to.be.equal(new BN(0).toString());
        await expectRevert(instanceVesting.setInitialTimestamp(new BN(60), { from: acc2 }), "Ownable: caller is not the owner");
        let vestingStartDate = await instanceVesting.vestingStartDate.call();
        expect(vestingStartDate.toString()).to.be.equal(new BN(0).toString());
      });
      it("setInitialTimestamp - Error : 'initialTimestamp_' must be greater than 0", async () => {
        let vestingStartDateBefore = await instanceVesting.vestingStartDate.call();
        expect(vestingStartDateBefore.toString()).to.be.equal(new BN(0).toString());
        await expectRevert(instanceVesting.setInitialTimestamp(new BN(0)), "Error : 'initialTimestamp_' must be greater than 0");
        let vestingStartDate = await instanceVesting.vestingStartDate.call();
        expect(vestingStartDate.toString()).to.be.equal(new BN(0).toString());
      });
    });

    describe("setInitialTimestamp function - done", async () => {
      it("setInitialTimestamp - set 60 seconds to wait", async () => {
        let vestingStartDateBefore = await instanceVesting.vestingStartDate.call();
        expect(vestingStartDateBefore.toString()).to.be.equal(new BN(0).toString());
        let tx = await instanceVesting.setInitialTimestamp(new BN(60));
        let vestingStartDate = await instanceVesting.vestingStartDate.call();
        let timeChecker = await time.latest();
        expect(vestingStartDate.toString()).to.be.equal(timeChecker.add(new BN(60)).toString());
        expectEvent(tx, "VestingStart", { startDate: timeChecker.add(new BN(60)) });
      });
    });

    describe("setInitialTimestamp function - false", async () => {
      it("setInitialTimestamp - error : call second time", async () => {
        await expectRevert(instanceVesting.setInitialTimestamp(new BN(60)), "error : can call only once time");
      });
    });
  });

  describe("addInvestors function", async () => {

    describe("addInvestors function - false", async () => {
      it("set Investors - Error : Different arrays length", async () => {
        let arrayInvestors = [acc2, acc3];
        let arrayAmounts = [ether('1000'), ether('2000'), ether('3000')];
        let arrayEnums = [new BN(0), new BN(1), new BN(0)];
        await instanceToken.approve(instanceVesting.address, ether('6000'));
        await expectRevert(instanceVesting.addInvestors(arrayInvestors, arrayAmounts, arrayEnums), "Error : Different arrays length");
      });
      it("set Investors - Error : Different arrays length", async () => {
        let arrayInvestors = [acc2, acc3];
        let arrayAmounts = [ether('1000'), ether('2000'), ether('3000')];
        let arrayEnums = [new BN(0), new BN(1)];
        await instanceToken.approve(instanceVesting.address, ether('6000'));
        await expectRevert(instanceVesting.addInvestors(arrayInvestors, arrayAmounts, arrayEnums), "Error : Different arrays length");
      });
      it("set Investors - Error : 'investors_' or 'amount_' , equal to 0", async () => {
        let arrayInvestors = [constants.ZERO_ADDRESS, acc3];
        let arrayAmounts = [ether('1000'), ether('2000')];
        let arrayEnums = [new BN(0), new BN(1)];
        await instanceToken.approve(instanceVesting.address, ether('6000'));
        await expectRevert(instanceVesting.addInvestors(arrayInvestors, arrayAmounts, arrayEnums), "Error : 'investors_' or 'amount_' , equal to 0");
      });
    });

    describe("Check Beneficiary struct before set value", async () => {
      it("check investors", async () => {
        let investor1 = await instanceVesting.listOfBeneficiaries(acc2);
        let investor2 = await instanceVesting.listOfBeneficiaries(acc3);
        let investor3 = await instanceVesting.listOfBeneficiaries(acc4);
        expect(investor1[0].toString()).to.be.equal(ether('0').toString());
        expect(investor1[1].toString()).to.be.equal(ether('0').toString());
        expect(investor1[2].toString()).to.be.equal(ether('0').toString());
        expect(investor2[0].toString()).to.be.equal(ether('0').toString());
        expect(investor2[1].toString()).to.be.equal(ether('0').toString());
        expect(investor2[2].toString()).to.be.equal(ether('0').toString());
        expect(investor3[0].toString()).to.be.equal(ether('0').toString());
        expect(investor3[1].toString()).to.be.equal(ether('0').toString());
        expect(investor3[2].toString()).to.be.equal(ether('0').toString());
      });
    });

    describe("addInvestors function - done", async () => {
      it("set Investors - done", async () => {
        let arrayInvestors = [acc2, acc3, acc4];
        let arrayAmounts = [ether('1000'), ether('2000'), ether('3000')];
        let arrayEnums = [new BN(0), new BN(1), new BN(0)];
        await instanceToken.approve(instanceVesting.address, ether('6000'));
        let tx = await instanceVesting.addInvestors(arrayInvestors, arrayAmounts, arrayEnums);
        let event = expectEvent(tx, "AddInvestors");
        expectEvent(tx, "AddInvestors", { investors: arrayInvestors });
        expect(event.args.balances.toString()).to.be.equal(arrayAmounts.toString());
      });
      it("set Investors - done acc4 , have to allocations", async () => {
        let arrayInvestors = [acc4];
        let arrayAmounts = [ether('1000')];
        let arrayEnums = [new BN(1)];
        investor3 = await instanceVesting.listOfBeneficiaries(acc4);
        expect(investor3[2].toString()).to.be.equal(ether('2700').toString());
        await instanceToken.approve(instanceVesting.address, ether('1000'));
        let tx = await instanceVesting.addInvestors(arrayInvestors, arrayAmounts, arrayEnums);
        investor3After = await instanceVesting.listOfBeneficiaries(acc4);
        expect(investor3After[2].toString()).to.be.equal(ether('3550').toString());
        let event = expectEvent(tx, "AddInvestors");
        expectEvent(tx, "AddInvestors", { investors: arrayInvestors });
        expect(event.args.balances.toString()).to.be.equal(arrayAmounts.toString());
      });
    });

    describe("addInvestors function - check result", async () => {
      it("check investors", async () => {
        let investor1 = await instanceVesting.listOfBeneficiaries(acc2);
        let investor2 = await instanceVesting.listOfBeneficiaries(acc3);
        let investor3 = await instanceVesting.listOfBeneficiaries(acc4);
        expect(investor1[0].toString()).to.be.equal(ether('100').toString());
        expect(investor1[1].toString()).to.be.equal(ether('0').toString());
        expect(investor1[2].toString()).to.be.equal(ether('900').toString());
        expect(investor2[0].toString()).to.be.equal(ether('300').toString());
        expect(investor2[1].toString()).to.be.equal(ether('0').toString());
        expect(investor2[2].toString()).to.be.equal(ether('1700').toString());
        expect(investor3[0].toString()).to.be.equal(ether('450').toString());
        expect(investor3[1].toString()).to.be.equal(ether('0').toString());
        expect(investor3[2].toString()).to.be.equal(ether('3550').toString());
      });
    });
  });

  describe("withdrawTokens function", async () => {
    describe("withdrawTokens function - false", async () => {
      it("withdrawTokens - Error : wait until cliff period is end ", async () => {
        let balanceBefore = await instanceToken.balanceOf(acc2);
        expect(balanceBefore.toString()).to.be.equal(ether('0').toString());
        await expectRevert(instanceVesting.withdrawTokens({ from: acc2 }), "Error : wait until cliff period is end");
        let balanceTokens = await instanceToken.balanceOf(acc2);
        expect(balanceTokens.toString()).to.be.equal(ether('0').toString());
      });
    });

    describe("withdrawTokens function - done", async () => {
      it("take tokens with SEED allocation", async () => {
        let balanceBefore = await instanceToken.balanceOf(acc2);
        expect(balanceBefore.toString()).to.be.equal(ether('0').toString());
        let investor1 = await instanceVesting.listOfBeneficiaries(acc2);
        expect(investor1[1].toString()).to.be.equal(ether('0').toString());
        await time.increase(time.duration.seconds(661));
        let tx = await instanceVesting.withdrawTokens({ from: acc2 });
        let investorr1 = await instanceVesting.listOfBeneficiaries(acc2);
        expect(investorr1[1].toString()).to.be.equal(ether('100').toString());
        balanceTokens = await instanceToken.balanceOf(acc2);
        expect(balanceTokens.toString()).to.be.equal(ether('100').toString())
        expectEvent(tx, "Withdraw", { to: acc2, amountTokens: ether('100') });
      });
      it("take tokens with PRIVATE allocation", async () => {
        let balanceBefore = await instanceToken.balanceOf(acc3);
        expect(balanceBefore.toString()).to.be.equal(ether('0').toString());
        let investor2 = await instanceVesting.listOfBeneficiaries(acc3);
        expect(investor2[1].toString()).to.be.equal(ether('0').toString());
        let tx = await instanceVesting.withdrawTokens({ from: acc3 });
        balanceTokens = await instanceToken.balanceOf(acc3);
        expect(balanceTokens.toString()).to.be.equal(ether('300').toString());
        let investorr2 = await instanceVesting.listOfBeneficiaries(acc3);
        expect(investorr2[1].toString()).to.be.equal(ether('300').toString());
        expectEvent(tx, "Withdraw", { to: acc3, amountTokens: ether('300') });
      });
      it("take tokens with BOTH allocation", async () => {
        let balanceBefore = await instanceToken.balanceOf(acc4);
        expect(balanceBefore.toString()).to.be.equal(ether('0').toString());
        let investor3 = await instanceVesting.listOfBeneficiaries(acc4);
        expect(investor3[1].toString()).to.be.equal(ether('0').toString());
        let tx = await instanceVesting.withdrawTokens({ from: acc4 });
        balanceTokens = await instanceToken.balanceOf(acc4);
        expect(balanceTokens.toString()).to.be.equal(ether('450').toString());
        let investorr3 = await instanceVesting.listOfBeneficiaries(acc4);
        expect(investorr3[1].toString()).to.be.equal(ether('450').toString());
        expectEvent(tx, "Withdraw", { to: acc4, amountTokens: ether('450') });
      });
      it("take tokens AFTER 700 MINUTES", async () => {
        let balanceBefore = await instanceToken.balanceOf(acc2);
        expect(balanceBefore.toString()).to.be.equal(ether('100').toString());
        let investor1 = await instanceVesting.listOfBeneficiaries(acc2);
        expect(investor1[1].toString()).to.be.equal(ether('100').toString());
        await time.increase(time.duration.minutes(700));
        let tx = await instanceVesting.withdrawTokens({ from: acc2 });
        balanceTokens = await instanceToken.balanceOf(acc2);
        expect(balanceTokens.toString()).to.be.equal(ether('1000').toString());
        let investorr1 = await instanceVesting.listOfBeneficiaries(acc2);
        expect(investorr1[1].toString()).to.be.equal(ether('1000').toString());
        expectEvent(tx, "Withdraw", { to: acc2, amountTokens: ether('900') });
      });
    });

    describe("withdrawTokens function - false", async () => {
      it("withdrawTokens function - call after withdraw all tokens by acc2", async () => {
        let balanceTokensBefore = await instanceToken.balanceOf(acc2);
        expect(balanceTokensBefore.toString()).to.be.equal(ether('1000').toString())
        await expectRevert(instanceVesting.withdrawTokens({ from: acc2 }), "Error : not enougth tokens");
        let balanceTokens = await instanceToken.balanceOf(acc2);
        expect(balanceTokens.toString()).to.be.equal(ether('1000').toString())
      });
      it("withdrawTokens - Error : not enougth tokens ", async () => {
        let balanceBefore = await instanceToken.balanceOf(owner);
        expect(balanceBefore.toString()).to.be.equal(ether('93000').toString())
        await expectRevert(instanceVesting.withdrawTokens({ from: owner }), "Error : not enougth tokens");
        let balanceTokens = await instanceToken.balanceOf(owner);
        expect(balanceTokens.toString()).to.be.equal(ether('93000').toString())
      });
    });

  });


});
