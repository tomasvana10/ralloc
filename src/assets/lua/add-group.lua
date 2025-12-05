local groupMetadataKey = KEYS[1]

-- check 1. does group not exist?
local exists = redis.call("EXISTS", groupMetadataKey)
if exists == 1 then
  return {"failure", "existent"}
end

redis.call("HSET", groupMetadataKey, "_", "_")
return {"success", ""}