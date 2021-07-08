# 함수 정의

## 팀을 찾는 함수
```javascript
/**
 * Parameter : teamName , userName
 * Destination : 팀 이름과 유저이름을 이요하여 디비에 저장된 팀을 찾아낸다.
*/
async function findTeam(teamName, userName) {
    const teamCollection = await teamDbCollection();
    let teamCursor;
    if (!(teamName && userName)) {
        teamCursor = await teamCollection.findOne({
            teamName: teamName,
        });
        return teamCursor;
    }
    teamCursor = await teamCollection.findOne({
        $and: [
            { teamName: teamName },
            {
                creator: userName,
            },
        ],
    });
    return teamCursor;
}
```