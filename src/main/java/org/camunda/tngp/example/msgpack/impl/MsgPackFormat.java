package org.camunda.tngp.example.msgpack.impl;

public enum MsgPackFormat
{
    FIXSTR(MsgPackType.STRING, 0xa0, 0xe0),
    STR_8(MsgPackType.STRING, 0xd9, 0xff),
    STR_16(MsgPackType.STRING, 0xda, 0xff),
    STR_32(MsgPackType.STRING, 0xdb, 0xff),
    FIXMAP(MsgPackType.MAP, 0x80, 0xf0);

    protected MsgPackType type;
    protected int prefix;
    protected int bitmask;

    private MsgPackFormat(MsgPackType type, int prefix, int bitmask)
    {
        this.type = type;
        this.prefix = prefix;
        this.bitmask = bitmask;
    }

    public boolean applies(byte formatPrefix)
    {
        return (formatPrefix & 0xff & bitmask) == prefix;
    }

    public MsgPackType getType()
    {
        return type;
    }

    public static MsgPackFormat getFormat(byte formatByte)
    {
        if (FIXSTR.applies(formatByte))
        {
            return MsgPackFormat.FIXSTR;
        }
        else if (STR_8.applies(formatByte))
        {
            return MsgPackFormat.STR_8;
        }
        else
        {
            throw new RuntimeException("unrecognized format");
        }
    }

}
