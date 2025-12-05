local groupMetadataKey = KEYS[1]
local groupMembersKey = KEYS[2]

local userGroupTemplate = ARGV[1]
local representationUnitSeparator = ARGV[2]
local sep = ARGV[3]

-- check 1. does group exist?
local exists = redis.call("EXISTS", groupMetadataKey)
if exists == 0 then
  return {"failure", "nonexistent"}
end

local members = redis.call("SMEMBERS", groupMembersKey)
for _, member in ipairs(members) do
  local userId = string.match(member, "^([^" .. representationUnitSeparator .. "]+)")
  redis.call("DEL", userGroupTemplate .. sep .. userId)
end

redis.call("DEL", groupMetadataKey, groupMembersKey)
return {"success", ""}