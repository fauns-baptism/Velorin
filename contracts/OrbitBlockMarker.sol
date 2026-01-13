// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract OrbitBlockMarker {
    struct Marker {
        uint256 blockNumber;
        uint256 timestamp;
        string note;
        address caller;
    }

    uint256 public markerCount;
    mapping(uint256 => Marker) public markers;

    event MarkerRecorded(
        uint256 indexed id,
        uint256 blockNumber,
        address indexed caller,
        string note
    );

    function record(string calldata note) external {
        markerCount += 1;

        markers[markerCount] = Marker({
            blockNumber: block.number,
            timestamp: block.timestamp,
            note: note,
            caller: msg.sender
        });

        emit MarkerRecorded(
            markerCount,
            block.number,
            msg.sender,
            note
        );
    }

    function getMarker(uint256 id)
        external
        view
        returns (
            uint256 blockNumber,
            uint256 timestamp,
            string memory note,
            address caller
        )
    {
        Marker memory m = markers[id];
        return (m.blockNumber, m.timestamp, m.note, m.caller);
    }
}
