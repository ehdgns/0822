/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
/**
 * Write your transction processor functions here
 */

/**
 * Sample transaction
 * @param {com.betweak.carauction.Offer} offer
 * @transaction
 */

//트랜잭션 정의
async function makeOffer(offer) {
    // Save the old value of the asset.
    let listing = offer.listing;
    if (listing.state !== "FOR_SALE") {
        throw new Error("listing is not for sale");
    }

    if(!listing.offers) {
        listing.offers = [];
    }
    listing.offers.push(offer);

    const carListingRegistry = await getAssetRegistry(
        "com.betweak.carauction.CarListing"
    );
    await carListingRegistry.update(listing);
}

/**
 * Sample transaction
 * @param {com.betweak.carauction.CloseBidding} CloseBidding
 * @transaction
 */
async function CloseBidding(CloseBidding) {

    const listing = CloseBidding.listing;
    if(listing.state !== "for sale") {
        throw new Error("Listing is not for sale");
    }

    listing.state = "reserve not met";
    let highestOffer = null;
    let buyer = null;
    let seller = null;

    if (listing.offers && listing.offers.length > 0) {
        listing.offers.sort(function(a,b) {
            return b.bidPrice - a.bidPrice;
        });

        highestOffer = listing.offers[0];
        if (highestOffer.bidPrice >= listing.reservePrice) {
            listing.state = "SOLD";
            buyer = highestOffer.member;
            seller = listing.car.owner;

            console.log("#### 거래전 판매자 잔고: " + seller.balance);
      seller.balance += highestOffer.bidPrice;
      console.log("#### 거래후 판매자 잔고: " + seller.balance);
      //  구매자 잔고 업데이트
      console.log("#### 거래전 구매자 잔고: " + buyer.balance);
      buyer.balance -= highestOffer.bidPrice;
      console.log("#### 거래후 구매자 잔고: " + buyer.balance);
      // 차의 주인 변경
      listing.car.owner = buyer;
      // 옥션 초기화
      listing.offers = null;
        }
    }
    if (highestOffer) {
        const carRegistry = await getAssetRegistry("com.betweak.carauction.Car");
        await carRegistry.update(listing.car);
    }

    const carListingRegistry = await getAssetRegistry(
        "com.betweak.carauction.CarListing"
    );
    await carListingRegistry.update(listing);

    if (listing.state === "SOLD") {
        const userRegistry = await getParticipantRegistry(
            "com.betweak.carauction.Member"
        );
        await userRegistry.updateAll([buyer, seller]);
    }
}

