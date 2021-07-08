module.exports = () => {
  return {
    isAuthenticated : (req,res,next) => {
      if (req.isAuthenticated()) return next();
      return next(new Error("403 | 권한이 없습니다."));
    },
    isTeamAuthenticated : async(req,res,next) => {
      const userDb = await userDbCollection();
      const user = await userDb.findOne({email : req.user.email});
      const team = user.team.filter((ele) => ele === req.params.page);
      if(!team) return next(new Error("403 | 해당 팀에 권한을 가지고 있지 않습니다."));
      return next();
    }
  }
}