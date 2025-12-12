local sessionMetadataKey = KEYS[1]
local groupMetadataKey = KEYS[2]

local groupCountKeyName = ARGV[1]
local maxGroups = tonumber(ARGV[2])

-- check 1. does group not exist?
local exists = redis.call("EXISTS", groupMetadataKey)
if exists == 1 then
  return {"failure", "existent"}
end

-- check 2. will adding this group exceed the max allowed groups?
local groupCount = tonumber(redis.call("HGET", sessionMetadataKey, groupCountKeyName) or 0)
if groupCount >= maxGroups then
  return {"failure", "maxGroupsReached"}
end

redis.call("HINCRBY", sessionMetadataKey, groupCountKeyName, 1)

redis.call("HSET", groupMetadataKey, "_", "_")
return {"success", ""}