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

let Allocation = {
  Seed: 0,
  Private: 1
}

contract("Vesting", async ([owner, acc2, acc3, acc4, acc5]) => {

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
        let vestingStartDateBefore = await instanceVesting.vestingStartDate();
        expect(vestingStartDateBefore).to.be.bignumber.equal(new BN(0));
        await expectRevert(instanceVesting.setInitialTimestamp(new BN(60), { from: acc2 }), "Ownable: caller is not the owner");
        let vestingStartDate = await instanceVesting.vestingStartDate();
        expect(vestingStartDate).to.be.bignumber.equal(new BN(0));
      });
      it("setInitialTimestamp - Error : 'initialTimestamp_' must be greater than 0", async () => {
        let vestingStartDateBefore = await instanceVesting.vestingStartDate();
        expect(vestingStartDateBefore).to.be.bignumber.equal(new BN(0));
        await expectRevert(instanceVesting.setInitialTimestamp(new BN(0)), "Error : 'initialTimestamp_' must be greater than 0");
        let vestingStartDate = await instanceVesting.vestingStartDate();
        expect(vestingStartDate).to.be.bignumber.equal(new BN(0));
      });
    });

    describe("withdrawTokens function - false", async () => {
      it("withdrawTokens - Error : Time for claim not setup'", async () => {
        let balanceBefore = await instanceToken.balanceOf(acc2);
        expect(balanceBefore).to.be.bignumber.equal(ether('0'));
        await expectRevert(instanceVesting.withdrawTokens({ from: acc2 }), "Error : Time for claim not setup");
        let balanceTokens = await instanceToken.balanceOf(acc2);
        expect(balanceTokens).to.be.bignumber.equal(ether('0'));
      });
    });

    describe("setInitialTimestamp function - done", async () => {
      it("setInitialTimestamp - set 60 seconds to wait", async () => {
        let vestingStartDateBefore = await instanceVesting.vestingStartDate();
        expect(vestingStartDateBefore).to.be.bignumber.equal(new BN(0));
        let date = await time.latest();
        let tx = await instanceVesting.setInitialTimestamp(date);
        let vestingStartDate = await instanceVesting.vestingStartDate();
        expect(vestingStartDate).to.be.bignumber.equal(date);
        expectEvent(tx, "SetInitialTime", { startDate: date });
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
        let arrayEnums = [Allocation.Seed, Allocation.Private, Allocation.Seed];
        await instanceToken.approve(instanceVesting.address, ether('6000'));
        await expectRevert(instanceVesting.addInvestors(arrayInvestors, arrayAmounts, arrayEnums), "Error : Different arrays length");
      });
      it("set Investors - Error : Different arrays length", async () => {
        let arrayInvestors = [acc2, acc3];
        let arrayAmounts = [ether('1000'), ether('2000'), ether('3000')];
        let arrayEnums = [Allocation.Seed, Allocation.Private];
        await instanceToken.approve(instanceVesting.address, ether('6000'));
        await expectRevert(instanceVesting.addInvestors(arrayInvestors, arrayAmounts, arrayEnums), "Error : Different arrays length");
      });
      it("set Investors - Error : 'investors_' or 'amount_' , equal to 0", async () => {
        let arrayInvestors = [constants.ZERO_ADDRESS, acc3];
        let arrayAmounts = [ether('1000'), ether('2000')];
        let arrayEnums = [Allocation.Seed, Allocation.Private];
        await instanceToken.approve(instanceVesting.address, ether('6000'));
        await expectRevert(instanceVesting.addInvestors(arrayInvestors, arrayAmounts, arrayEnums), "Error : 'investors_' or 'amount_' , equal to 0");
      });
    });

    describe("Check Beneficiary struct before set value", async () => {
      it("check investors", async () => {
        let investor1 = await instanceVesting.listOfBeneficiaries(acc2);
        let investor2 = await instanceVesting.listOfBeneficiaries(acc3);
        let investor3 = await instanceVesting.listOfBeneficiaries(acc4);
        expect(investor1[0]).to.be.bignumber.equal(ether('0'));
        expect(investor1[1]).to.be.bignumber.equal(ether('0'));
        expect(investor1[2]).to.be.bignumber.equal(ether('0'));
        expect(investor1[3]).to.be.bignumber.equal(ether('0'));
        expect(investor2[0]).to.be.bignumber.equal(ether('0'));
        expect(investor2[1]).to.be.bignumber.equal(ether('0'));
        expect(investor2[2]).to.be.bignumber.equal(ether('0'));
        expect(investor2[3]).to.be.bignumber.equal(ether('0'));
        expect(investor3[0]).to.be.bignumber.equal(ether('0'));
        expect(investor3[1]).to.be.bignumber.equal(ether('0'));
        expect(investor3[2]).to.be.bignumber.equal(ether('0'));
        expect(investor3[3]).to.be.bignumber.equal(ether('0'));
      });
    });

    describe("addInvestors function - done", async () => {
      it("set Investors - done", async () => {
        let arrayInvestors = [acc2, acc3, acc4];
        let arrayAmounts = [ether('1000'), ether('2000'), ether('3000')];
        let arrayEnums = [Allocation.Seed, Allocation.Private, Allocation.Seed];
        await instanceToken.approve(instanceVesting.address, ether('6000'));
        let balanceBefore = await instanceToken.balanceOf(owner);
        expect(balanceBefore).to.be.bignumber.equal(ether('100000'));
        let tx = await instanceVesting.addInvestors(arrayInvestors, arrayAmounts, arrayEnums);
        let balanceAfter = await instanceToken.balanceOf(owner);
        expect(balanceAfter).to.be.bignumber.equal(ether('94000'));
        let event = expectEvent(tx, "AddInvestors");
        expectEvent(tx, "AddInvestors", { investors: arrayInvestors });
        expect(event.args.balances.toString()).to.be.equal(arrayAmounts.toString());
        expect(event.args.allocations.toString()).to.be.equal(arrayEnums.toString());
      });
      it("set Investors - done acc4 , have two allocations", async () => {
        let arrayInvestors = [acc4];
        let arrayAmounts = [ether('1000')];
        let arrayEnums = [Allocation.Private];
        investor3 = await instanceVesting.listOfBeneficiaries(acc4);
        expect(investor3[2]).to.be.bignumber.equal(ether('2700'));
        await instanceToken.approve(instanceVesting.address, ether('1000'));
        let balanceBefore = await instanceToken.balanceOf(owner);
        expect(balanceBefore).to.be.bignumber.equal(ether('94000'));
        let tx = await instanceVesting.addInvestors(arrayInvestors, arrayAmounts, arrayEnums);
        let balanceAfter = await instanceToken.balanceOf(owner);
        expect(balanceAfter).to.be.bignumber.equal(ether('93000'));
        investor3After = await instanceVesting.listOfBeneficiaries(acc4);
        expect(investor3After[2]).to.be.bignumber.equal(ether('3550'));
        let event = expectEvent(tx, "AddInvestors");
        expectEvent(tx, "AddInvestors", { investors: arrayInvestors });
        expect(event.args.balances.toString()).to.be.equal(arrayAmounts.toString());
        expect(event.args.allocations.toString()).to.be.equal(arrayEnums.toString());
      });
    });

    describe("addInvestors function - check result", async () => {
      it("check investors", async () => {
        let investor1 = await instanceVesting.listOfBeneficiaries(acc2);
        let investor2 = await instanceVesting.listOfBeneficiaries(acc3);
        let investor3 = await instanceVesting.listOfBeneficiaries(acc4);
        expect(investor1[0]).to.be.bignumber.equal(ether('100').toString());
        expect(investor1[1]).to.be.bignumber.equal(ether('0').toString());
        expect(investor1[2]).to.be.bignumber.equal(ether('900').toString());
        expect(investor1[3]).to.be.bignumber.equal(Allocation.Seed.toString());
        expect(investor2[0]).to.be.bignumber.equal(ether('300').toString());
        expect(investor2[1]).to.be.bignumber.equal(ether('0').toString());
        expect(investor2[2]).to.be.bignumber.equal(ether('1700').toString());
        expect(investor2[3]).to.be.bignumber.equal(Allocation.Private.toString());
        expect(investor3[0]).to.be.bignumber.equal(ether('450').toString());
        expect(investor3[1]).to.be.bignumber.equal(ether('0').toString());
        expect(investor3[2]).to.be.bignumber.equal(ether('3550').toString());
        expect(investor3[3]).to.be.bignumber.equal(Allocation.Private.toString());
      });
    });
  });

  describe("withdrawTokens function", async () => {
    describe("withdrawTokens function - false", async () => {
      it("withdrawTokens - Error : wait until cliff period is end ", async () => {
        let balanceBefore = await instanceToken.balanceOf(acc2);
        expect(balanceBefore).to.be.bignumber.equal(ether('0'));
        await expectRevert(instanceVesting.withdrawTokens({ from: acc2 }), "Error : wait until cliff period is end");
        let balanceTokens = await instanceToken.balanceOf(acc2);
        expect(balanceTokens).to.be.bignumber.equal(ether('0'));
      });
    });

    describe("withdrawTokens function - done", async () => {
      it("take tokens with SEED allocation", async () => {
        let balanceBefore = await instanceToken.balanceOf(acc2);
        expect(balanceBefore).to.be.bignumber.equal(ether('0'));
        let investor1 = await instanceVesting.listOfBeneficiaries(acc2);
        expect(investor1[1]).to.be.bignumber.equal(ether('0'));
        await time.increase(time.duration.minutes(10));
        let tx = await instanceVesting.withdrawTokens({ from: acc2 });
        let investorr1 = await instanceVesting.listOfBeneficiaries(acc2);
        expect(investorr1[1]).to.be.bignumber.equal(ether('100'));
        balanceTokens = await instanceToken.balanceOf(acc2);
        expect(balanceTokens).to.be.bignumber.equal(ether('100'))
        expectEvent(tx, "Withdraw", { to: acc2, amountTokens: ether('100') });
      });
      it("take tokens with PRIVATE allocation", async () => {
        let balanceBefore = await instanceToken.balanceOf(acc3);
        expect(balanceBefore).to.be.bignumber.equal(ether('0'));
        let investor2 = await instanceVesting.listOfBeneficiaries(acc3);
        expect(investor2[1]).to.be.bignumber.equal(ether('0'));
        let tx = await instanceVesting.withdrawTokens({ from: acc3 });
        balanceTokens = await instanceToken.balanceOf(acc3);
        expect(balanceTokens).to.be.bignumber.equal(ether('300'));
        let investorr2 = await instanceVesting.listOfBeneficiaries(acc3);
        expect(investorr2[1]).to.be.bignumber.equal(ether('300'));
        expectEvent(tx, "Withdraw", { to: acc3, amountTokens: ether('300') });
      });
      it("take tokens with BOTH allocation", async () => {
        let balanceBefore = await instanceToken.balanceOf(acc4);
        expect(balanceBefore).to.be.bignumber.equal(ether('0'));
        let investor3 = await instanceVesting.listOfBeneficiaries(acc4);
        expect(investor3[1]).to.be.bignumber.equal(ether('0'));
        let tx = await instanceVesting.withdrawTokens({ from: acc4 });
        balanceTokens = await instanceToken.balanceOf(acc4);
        expect(balanceTokens).to.be.bignumber.equal(ether('450'));
        let investorr3 = await instanceVesting.listOfBeneficiaries(acc4);
        expect(investorr3[1]).to.be.bignumber.equal(ether('450'));
        expectEvent(tx, "Withdraw", { to: acc4, amountTokens: ether('450') });
      });
      it("take tokens AFTER 300 MINUTES by acc2", async () => {
        let balanceBefore = await instanceToken.balanceOf(acc2);
        expect(balanceBefore).to.be.bignumber.equal(ether('100'));
        let investor1 = await instanceVesting.listOfBeneficiaries(acc2);
        expect(investor1[1]).to.be.bignumber.equal(ether('100'));
        await time.increase(time.duration.minutes(300));
        let tx = await instanceVesting.withdrawTokens({ from: acc2 });
        let investorr1 = await instanceVesting.listOfBeneficiaries(acc2);
        expect(investorr1[1]).to.be.bignumber.equal(ether('550'));
        balanceTokens = await instanceToken.balanceOf(acc2);
        expect(balanceTokens).to.be.bignumber.equal(ether('550'));
        expectEvent(tx, "Withdraw", { to: acc2, amountTokens: ether('450') });
      });

      it("withdrawTokens function - Error : 'amount' equal to 0", async () => {
        let balanceTokensBefore = await instanceToken.balanceOf(acc2);
        expect(balanceTokensBefore).to.be.bignumber.equal(ether('550'))
        await expectRevert(instanceVesting.withdrawTokens({ from: acc2 }), "Error : 'amount' equal to 0");
        let balanceTokens = await instanceToken.balanceOf(acc2);
        expect(balanceTokens).to.be.bignumber.equal(ether('550'))
      });

      it("take tokens AFTER 597 MINUTES by acc2", async () => {
        let balanceBefore = await instanceToken.balanceOf(acc2);
        expect(balanceBefore).to.be.bignumber.equal(ether('550'));
        let investor1 = await instanceVesting.listOfBeneficiaries(acc2);
        expect(investor1[1]).to.be.bignumber.equal(ether('550'));
        await time.increase(time.duration.minutes(297));
        let tx = await instanceVesting.withdrawTokens({ from: acc2 });
        let investorr1 = await instanceVesting.listOfBeneficiaries(acc2);
        expect(investorr1[1]).to.be.bignumber.equal(ether('991'));
        balanceTokens = await instanceToken.balanceOf(acc2);
        expect(balanceTokens).to.be.bignumber.equal(ether('991'));
        expectEvent(tx, "Withdraw", { to: acc2, amountTokens: ether('441') });
      });

      it("set Investors - done , acc5", async () => {
        let arrayInvestors = [acc5];
        let arrayAmounts = [ether('1000')];
        let arrayEnums = [Allocation.Private];
        await instanceToken.approve(instanceVesting.address, ether('1000'));
        let tx = await instanceVesting.addInvestors(arrayInvestors, arrayAmounts, arrayEnums);
        let event = expectEvent(tx, "AddInvestors");
        expectEvent(tx, "AddInvestors", { investors: arrayInvestors });
        expect(event.args.balances.toString()).to.be.equal(arrayAmounts.toString());
        expect(event.args.allocations.toString()).to.be.equal(arrayEnums.toString());
      });

      it("check investors", async () => {
        let investor4 = await instanceVesting.listOfBeneficiaries(acc5);
        expect(investor4[0]).to.be.bignumber.equal(ether('150').toString());
        expect(investor4[1]).to.be.bignumber.equal(ether('0').toString());
        expect(investor4[2]).to.be.bignumber.equal(ether('850').toString());
        expect(investor4[3]).to.be.bignumber.equal(Allocation.Private.toString());
      });

      it("take tokens AFTER 597 MINUTES by acc5", async () => {
        let balanceBefore = await instanceToken.balanceOf(acc5);
        expect(balanceBefore).to.be.bignumber.equal(ether('0'));
        let investor1 = await instanceVesting.listOfBeneficiaries(acc5);
        expect(investor1[1]).to.be.bignumber.equal(ether('0'));
        let balanceBeforeOwner = await instanceToken.balanceOf(owner);
        expect(balanceBeforeOwner).to.be.bignumber.equal(ether('92000'));
        let tx = await instanceVesting.withdrawTokens({ from: acc5 });
        let balanceAfterOwner = await instanceToken.balanceOf(owner);
        expect(balanceAfterOwner).to.be.bignumber.equal(ether('92000'));
        let investorr1 = await instanceVesting.listOfBeneficiaries(acc5);
        expect(investorr1[1]).to.be.bignumber.equal(ether('991.5'));
        balanceTokens = await instanceToken.balanceOf(acc2);
        expect(balanceTokens).to.be.bignumber.equal(ether('991'));
        expectEvent(tx, "Withdraw", { to: acc5, amountTokens: ether('991.5') });
      });
      it("take tokens AFTER 600 MINUTES by acc2", async () => {
        let balanceBefore = await instanceToken.balanceOf(acc2);
        expect(balanceBefore).to.be.bignumber.equal(ether('991'));
        let investor1 = await instanceVesting.listOfBeneficiaries(acc2);
        expect(investor1[1]).to.be.bignumber.equal(ether('991'));
        await time.increase(time.duration.minutes(10));
        let tx = await instanceVesting.withdrawTokens({ from: acc2 });
        balanceTokens = await instanceToken.balanceOf(acc2);
        expect(balanceTokens).to.be.bignumber.equal(ether('1000'));
        let investorr1 = await instanceVesting.listOfBeneficiaries(acc2);
        expect(investorr1[1]).to.be.bignumber.equal(ether('1000'));
        expectEvent(tx, "Withdraw", { to: acc2, amountTokens: ether('9') });
      });
      it("set Investors - done , acc2 in second time", async () => {
        let arrayInvestors = [acc2];
        let arrayAmounts = [ether('1000')];
        let arrayEnums = [Allocation.Private];
        await instanceToken.approve(instanceVesting.address, ether('1000'));
        let balanceBefore = await instanceToken.balanceOf(owner);
        expect(balanceBefore).to.be.bignumber.equal(ether('92000'));
        let tx = await instanceVesting.addInvestors(arrayInvestors, arrayAmounts, arrayEnums);
        let balanceAfter = await instanceToken.balanceOf(owner);
        expect(balanceAfter).to.be.bignumber.equal(ether('91000'));
        let event = expectEvent(tx, "AddInvestors");
        expectEvent(tx, "AddInvestors", { investors: arrayInvestors });
        expect(event.args.balances.toString()).to.be.equal(arrayAmounts.toString());
        expect(event.args.allocations.toString()).to.be.equal(arrayEnums.toString());
      });
      it("take tokens AFTER 600 MINUTES by acc2 in second time", async () => {
        let balanceBefore = await instanceToken.balanceOf(acc2);
        expect(balanceBefore).to.be.bignumber.equal(ether('1000'));
        let investor1 = await instanceVesting.listOfBeneficiaries(acc2);
        expect(investor1[1]).to.be.bignumber.equal(ether('1000'));
        let tx = await instanceVesting.withdrawTokens({ from: acc2 });
        balanceTokens = await instanceToken.balanceOf(acc2);
        expect(balanceTokens).to.be.bignumber.equal(ether('2000'));
        let investorr1 = await instanceVesting.listOfBeneficiaries(acc2);
        expect(investorr1[1]).to.be.bignumber.equal(ether('2000'));
        expectEvent(tx, "Withdraw", { to: acc2, amountTokens: ether('1000') });
      });
      it("take tokens AFTER 600 MINUTES by acc4 two allocations", async () => {
        let balanceBefore = await instanceToken.balanceOf(acc4);
        expect(balanceBefore).to.be.bignumber.equal(ether('450'));
        let investor3 = await instanceVesting.listOfBeneficiaries(acc4);
        expect(investor3[1]).to.be.bignumber.equal(ether('450'));
        await time.increase(time.duration.minutes(300));
        let tx = await instanceVesting.withdrawTokens({ from: acc4 });
        balanceTokens = await instanceToken.balanceOf(acc4);
        expect(balanceTokens).to.be.bignumber.equal(ether('4000'));
        let investorr3 = await instanceVesting.listOfBeneficiaries(acc4);
        expect(investorr3[1]).to.be.bignumber.equal(ether('4000'));
        expectEvent(tx, "Withdraw", { to: acc4, amountTokens: ether('3550') });
      });
    });

    describe("withdrawTokens function - false", async () => {
      it("withdrawTokens function - call after withdraw all tokens by acc2", async () => {
        let balanceTokensBefore = await instanceToken.balanceOf(acc2);
        expect(balanceTokensBefore).to.be.bignumber.equal(ether('2000'))
        await expectRevert(instanceVesting.withdrawTokens({ from: acc2 }), "Error : No available tokens to withdraw");
        let balanceTokens = await instanceToken.balanceOf(acc2);
        expect(balanceTokens).to.be.bignumber.equal(ether('2000'))
      });
      it("withdrawTokens - Error : No available tokens to withdraw ", async () => {
        let balanceBefore = await instanceToken.balanceOf(owner);
        expect(balanceBefore).to.be.bignumber.equal(ether('91000'))
        await expectRevert(instanceVesting.withdrawTokens({ from: owner }), "Error : No available tokens to withdraw");
        let balanceTokens = await instanceToken.balanceOf(owner);
        expect(balanceTokens).to.be.bignumber.equal(ether('91000'))
      });
    });

  });

});
