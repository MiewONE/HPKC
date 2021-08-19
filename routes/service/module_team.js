exports.deleteTeam = async (
    teamName, // 삭제할 팀 이름
    teamCursor, // 삭제할 팀 커서
    teamCreator, // 삭데할 팀의 관리자
    teamCollection, // 팀을 삭제하기 위한 디비콜레션
    userCollection, // 권한 확인을 위한 디비 콜렉션
    ptCollection, // 팀이 가진 발표를 삭제하기 위한 디비 콜렉션
    email, // 유저 이메일
) => {
    const requesterCursor = await userCollection.findOne({ email });

    if (!teamCursor) return { success: false, msg: "존재하지 않는 팀입니다." };
    if (requesterCursor.email !== teamCreator.email) {
        return {
            success: false,
            msg: "권한이 없습니다. " + teamCreator.email + "님이 관리자입니다.",
        };
    }

    const teamMembers = teamCursor.member_id;

    for (let i = 0; i < teamMembers.length; i++) {
        const user = await userCollection.findOne({
            _id: teamMembers[i],
        });
        const hasTeam = user.team.filter((ele) => ele !== teamCursor.teamName);

        await userCollection.updateOne(
            {
                _id: teamMembers[i],
            },
            {
                $set: {
                    team: [...hasTeam],
                },
                $currentDate: { lastModified: true },
            },
        );
    }
    const ptIds = teamCursor.pt_id;

    for (let i = 0; i < ptIds.length; i++) {
        await ptCollection.deleteOne({ _id: ptIds[i] });
    }
    await teamCollection.deleteOne({ _id: teamCursor._id });

    return { success: true, msg: teamName };
};
