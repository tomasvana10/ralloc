local sessionMetadataKey = KEYS[1]
local groupMetadataKey = KEYS[2]
local groupMembersKey = KEYS[3]

local groupCountKeyName = ARGV[1]
local minGroups = tonumber(ARGV[2])
local userGroupTemplate = ARGV[3]
local representationUnitSeparator = ARGV[4]
local sep = ARGV[5]

-- check 1. does group exist?
local exists = redis.call("EXISTS", groupMetadataKey)
if exists == 0 then
  return {"failure", "nonexistent"}
end

-- check 2. will removing this group cause the session to fall below the min allowed groups?
local groupCount = tonumber(redis.call("HGET", sessionMetadataKey, groupCountKeyName) or 0)
if groupCount <= minGroups then
  return {"failure", "minGroupsReached"}
end

redis.call("HINCRBY", sessionMetadataKey, groupCountKeyName, -1)

-- remove all userGroup reverse mappings
local members = redis.call("SMEMBERS", groupMembersKey)
for _, member in ipairs(members) do
  local userId = string.match(member, "^([^" .. representationUnitSeparator .. "]+)")
  redis.call("DEL", userGroupTemplate .. sep .. userId)
end

redis.call("DEL", groupMetadataKey, groupMembersKey)
return {"success", ""}